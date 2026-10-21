from __future__ import annotations

import argparse
import importlib.util
import json
import os
import subprocess
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("USE_FLAX", "0")
for module in ("tensorflow", "jax", "flax"):
    if importlib.util.find_spec(module) is not None:
        raise SystemExit("FORBIDDEN_FRAMEWORK_INSTALLED:" + module)

import torch
from huggingface_hub import model_info
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

MODEL_ID = os.environ.get("SOUL_LOCAL_GENERATION_MODEL_ID", "google/flan-t5-small")
TRANSFORMERS_SOURCE_SHA = os.environ.get("TRANSFORMERS_SOURCE_SHA", "6f2e80bdad560947903bb4bde8043ae95387069a")
PYTORCH_PINNED_SOURCE_SHA = os.environ.get("PYTORCH_SOURCE_SHA", "a84b7baa33f893ab92176c08a85b14455e60b2fc")
TOKEN = os.environ.get("SOUL_FUSION_MODEL_TOKEN", "").strip()
HOST = os.environ.get("SOUL_LOCAL_GENERATION_HOST", "0.0.0.0")
PORT = int(os.environ.get("SOUL_LOCAL_GENERATION_PORT", "18072"))

transformers_runtime_sha = subprocess.check_output(["git", "-C", "/opt/transformers", "rev-parse", "HEAD"], text=True).strip()
pytorch_repo_sha = subprocess.check_output(["git", "-C", "/opt/pytorch", "rev-parse", "FETCH_HEAD"], text=True).strip()
if transformers_runtime_sha != TRANSFORMERS_SOURCE_SHA:
    raise SystemExit("TRANSFORMERS_SOURCE_SHA_MISMATCH")
if pytorch_repo_sha != PYTORCH_PINNED_SOURCE_SHA:
    raise SystemExit("PYTORCH_SOURCE_SHA_MISMATCH")

torch.set_num_threads(max(1, min(2, torch.get_num_threads())))
MODEL_SHA = str(model_info(MODEL_ID).sha or "").strip()
if len(MODEL_SHA) != 40:
    raise SystemExit("LOCAL_GENERATION_MODEL_SHA_MISSING_OR_INVALID")

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, revision=MODEL_SHA)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_ID, revision=MODEL_SHA).to("cpu")
model.eval()

def generate(messages: Any, max_tokens: int, trace_id: str, correlation_id: str) -> dict[str, Any]:
    if not isinstance(messages, list) or not messages:
        raise ValueError("CHAT_MESSAGES_REQUIRED")
    parts = []
    for item in messages:
        if not isinstance(item, dict):
            continue
        role = str(item.get("role", "user")).strip().lower() or "user"
        body = item.get("content")
        if isinstance(body, str) and body.strip():
            parts.append(f"{role}: {body.strip()}")
    if not parts:
        raise ValueError("CHAT_TEXT_REQUIRED")
    prompt = (
        "Write a concise, evidence-aware software artifact in Markdown. Follow the requested structure.\n\n" + "\n\n".join(parts)
    )
    if len(prompt) > 24000:
        raise ValueError("CHAT_PROMPT_TOO_LARGE")
    if not trace_id or trace_id != correlation_id:
        raise ValueError("TRACE_CORRELATION_MISMATCH")
    max_new_tokens = max(48, min(256, int(max_tokens or 192)))
    started = time.perf_counter()
    encoded = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
    with torch.inference_mode():
        generated = model.generate(
            **encoded,
            max_new_tokens=max_new_tokens,
            num_beams=2,
            do_sample=False,
            no_repeat_ngram_size=3,
            early_stopping=True,
        )
    output = tokenizer.decode(generated[0], skip_special_tokens=True).strip()
    if not output:
        raise RuntimeError("LOCAL_GENERATION_EMPTY_OUTPUT")
    latency = round((time.perf_counter() - started) * 1000, 3)
    model_label = f"{MODEL_ID}@{MODEL_SHA}"
    completion_tokens = int(generated.shape[-1])
    prompt_tokens = int(encoded["input_ids"].shape[-1])
    result = {
        "id": "chatcmpl-" + uuid.uuid4().hex,
        "object": "chat.completion",
        "created": int(time.time()),
        "model": model_label,
        "choices": [{"index": 0, "message": {"role": "assistant", "content": output}, "finish_reason": "stop"}],
        "usage": {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens,
        },
        "soul_trace": {
            "provider": "local-transformers-pytorch-seq2seq",
            "model_id": MODEL_ID,
            "model_sha": MODEL_SHA,
            "trace_id": trace_id,
            "correlation_id": correlation_id,
            "latency_ms": latency,
            "device": "cpu",
            "transformers_source_sha": transformers_runtime_sha,
            "pytorch_pinned_source_sha": pytorch_repo_sha,
            "torch_version": torch.__version__,
            "torch_runtime_git_sha": torch.version.git_version,
        },
    }
    print(json.dumps({
        "event": "group_a.local_artifact.completed",
        "status": "PASS",
        "trace_id": trace_id,
        "correlation_id": correlation_id,
        "model_sha": MODEL_SHA,
        "latency_ms": latency,
        "output_chars": len(output),
        "exit_code": 0,
    }), flush=True)
    return result

def send_json(handler: BaseHTTPRequestHandler, status: int, obj: dict[str, Any]) -> None:
    body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: Any) -> None:
        return
    def do_GET(self) -> None:
        if self.path != "/health":
            send_json(self, 404, {"error": "NOT_FOUND"})
            return
        send_json(self, 200, {
            "ready": True,
            "provider": "local-transformers-pytorch-seq2seq",
            "model_id": MODEL_ID,
            "model_sha": MODEL_SHA,
            "device": "cpu",
            "transformers_source_sha": transformers_runtime_sha,
            "pytorch_pinned_source_sha": pytorch_repo_sha,
            "tensorflow_installed": importlib.util.find_spec("tensorflow") is not None,
            "jax_installed": importlib.util.find_spec("jax") is not None,
        })
    def do_POST(self) -> None:
        if self.path != "/v1/chat/completions":
            send_json(self, 404, {"error": "NOT_FOUND"})
            return
        if not TOKEN or self.headers.get("Authorization", "") != "Bearer " + TOKEN:
            send_json(self, 401, {"error": "UNAUTHORIZED"})
            return
        request: dict[str, Any] = {}
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size <= 0 or size > 32768:
                raise ValueError("REQUEST_SIZE_INVALID")
            request = json.loads(self.rfile.read(size))
            if not isinstance(request, dict):
                raise ValueError("REQUEST_OBJECT_REQUIRED")
            trace_id = str(request.get("trace_id") or self.headers.get("X-Soul-Trace-Id", "")).strip()
            correlation_id = str(request.get("correlation_id") or self.headers.get("X-Correlation-Id", "")).strip()
            if trace_id != self.headers.get("X-Soul-Trace-Id") or correlation_id != self.headers.get("X-Correlation-Id"):
                raise ValueError("TRACE_HEADERS_MISMATCH")
            send_json(self, 200, generate(request.get("messages"), request.get("max_tokens", 192), trace_id, correlation_id))
        except Exception as exc:
            print(json.dumps({
                "event": "group_a.local_artifact.failed",
                "error": str(exc),
                "trace_id": str(request.get("trace_id", "")),
            }), flush=True)
            send_json(self, 400, {"error": str(exc)})

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--serve", action="store_true")
    args = parser.parse_args()
    if not TOKEN:
        raise SystemExit("SOUL_FUSION_MODEL_TOKEN_REQUIRED")
    print(json.dumps({
        "event": "group_a.local_generator.ready",
        "model_id": MODEL_ID,
        "model_sha": MODEL_SHA,
        "host": HOST,
        "port": PORT,
        "transformers_source_sha": transformers_runtime_sha,
        "pytorch_pinned_source_sha": pytorch_repo_sha,
        "torch_version": torch.__version__,
        "device": "cpu",
    }), flush=True)
    if args.serve:
        ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
    else:
        raise SystemExit("GENERATOR_SERVE_MODE_REQUIRED")

if __name__ == "__main__":
    main()
