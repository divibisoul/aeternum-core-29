#!/usr/bin/env python3
import hashlib, json, statistics, time
from pathlib import Path
import torch
from huggingface_hub import hf_hub_download, model_info
from transformers import AutoModelForMaskedLM, AutoTokenizer, pipeline
model_id = "distilbert/distilbert-base-uncased"
text = "The capital of France is [MASK]."
torch.set_num_threads(2)
revision = model_info(model_id).sha
weights_path = Path(hf_hub_download(model_id, "model.safetensors", revision=revision))
digest = hashlib.sha256()
with weights_path.open("rb") as handle:
    for chunk in iter(lambda: handle.read(1024 * 1024), b""):
        digest.update(chunk)
weights_sha256 = digest.hexdigest()
tokenizer = AutoTokenizer.from_pretrained(model_id, revision=revision)
model = AutoModelForMaskedLM.from_pretrained(model_id, revision=revision, use_safetensors=True)
model.eval()
infer = pipeline("fill-mask", model=model, tokenizer=tokenizer, device=-1, top_k=5)
with torch.inference_mode():
    for _ in range(2):
        infer(text)
latencies, outputs = [], []
with torch.inference_mode():
    for _ in range(10):
        start = time.perf_counter_ns()
        result = infer(text)
        latencies.append((time.perf_counter_ns() - start) / 1_000_000)
        outputs.append([{"token": x["token_str"], "score": float(x["score"]), "sequence": x["sequence"]} for x in result])
if any(value != outputs[0] for value in outputs[1:]):
    raise RuntimeError("NONDETERMINISTIC_OUTPUTS")
if not outputs[0]:
    raise RuntimeError("EMPTY_MODEL_OUTPUT")
compile_probe = {"state": "NOT_RUN"}
try:
    inputs = tokenizer(text, return_tensors="pt")
    with torch.inference_mode():
        eager = model(**inputs).logits
    compiled = torch.compile(model, backend="inductor", mode="default")
    start = time.perf_counter_ns()
    with torch.inference_mode():
        _ = compiled(**inputs).logits
    first_ms = (time.perf_counter_ns() - start) / 1_000_000
    start = time.perf_counter_ns()
    with torch.inference_mode():
        warm = compiled(**inputs).logits
    warm_ms = (time.perf_counter_ns() - start) / 1_000_000
    equivalent = bool(torch.allclose(eager, warm, atol=1e-4, rtol=1e-4))
    compile_probe = {"state": "PASS" if equivalent else "FAIL", "first_call_including_compile_ms": round(first_ms, 3), "warm_call_ms": round(warm_ms, 3), "logits_equivalent": equivalent, "max_abs_delta": float((eager - warm).abs().max().item())}
except Exception as exc:
    compile_probe = {"state": "UNSUPPORTED_OR_FAILED", "error": (type(exc).__name__ + ": " + str(exc))[:1200]}
summary = {
    "state": "PASS", "mode": "real_cpu_inference", "model": model_id,
    "model_revision": revision, "weights_file": weights_path.name,
    "weights_sha256": weights_sha256, "backend": "PyTorch CPU", "task": "fill-mask",
    "input": text, "samples": len(latencies), "warmup_samples_excluded": 2,
    "latencies_ms": [round(x, 3) for x in latencies],
    "p50_ms": round(statistics.median(latencies), 3), "output_literal": outputs[0],
    "output_equivalent_across_samples": True, "torch_version": torch.__version__,
    "transformers_version": __import__("transformers").__version__, "torch_compile_probe": compile_probe,
}
print("SOUL_LOCAL_DISTILBERT_BENCHMARK=" + json.dumps(summary, sort_keys=True, ensure_ascii=False))
