import importlib.util
import json
import os
import statistics
import subprocess
import time

import torch
from huggingface_hub import model_info
from transformers import AutoModelForSequenceClassification, AutoTokenizer

TRANSFORMERS_SHA = os.environ["TRANSFORMERS_SOURCE_SHA"]
PYTORCH_SHA = os.environ["PYTORCH_SOURCE_SHA"]
MODEL_ID = "distilbert/distilbert-base-uncased-finetuned-sst-2-english"
TEXT = "The isolated SOUL runtime is executing a real CPU inference with pinned model sources."
for module in ("tensorflow", "jax", "flax"):
    if importlib.util.find_spec(module) is not None:
        raise SystemExit("FORBIDDEN_FRAMEWORK_INSTALLED:" + module)
transformers_sha_runtime = subprocess.check_output(
    ["git", "-C", "/opt/transformers", "rev-parse", "HEAD"], text=True
).strip()
pytorch_sha_runtime = subprocess.check_output(
    ["git", "-C", "/opt/pytorch", "rev-parse", "HEAD"], text=True
).strip()
metadata = {
    "event": "group_f.runtime",
    "transformers_source_sha": transformers_sha_runtime,
    "pytorch_source_sha": pytorch_sha_runtime,
    "torch_version": torch.__version__,
    "torch_runtime_git_sha": torch.version.git_version,
    "device": "cpu",
    "tensorflow_installed": importlib.util.find_spec("tensorflow") is not None,
    "jax_installed": importlib.util.find_spec("jax") is not None,
}
print(json.dumps(metadata, ensure_ascii=False), flush=True)
if transformers_sha_runtime != TRANSFORMERS_SHA:
    raise SystemExit("TRANSFORMERS_SOURCE_SHA_MISMATCH")
if pytorch_sha_runtime != PYTORCH_SHA:
    raise SystemExit("PYTORCH_SOURCE_SHA_MISMATCH")
if torch.version.git_version != PYTORCH_SHA:
    raise SystemExit("TORCH_RUNTIME_SHA_MISMATCH: wheel does not correspond to pinned PyTorch source commit")

torch.set_num_threads(max(1, min(4, torch.get_num_threads())))
model_ref = model_info(MODEL_ID)
model_sha = model_ref.sha
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, revision=model_sha)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_ID, revision=model_sha)
model.to("cpu")
encoded = tokenizer(TEXT, return_tensors="pt", truncation=True, max_length=128)
with torch.inference_mode():
    warm = model(**encoded)
samples = []
final_probs = None
with torch.inference_mode():
    for _ in range(5):
        started = time.perf_counter()
        output = model(**encoded)
        samples.append((time.perf_counter() - started) * 1000.0)
        final_probs = torch.softmax(output.logits, dim=-1)[0]
latency_p50 = statistics.median(samples)
label_id = int(torch.argmax(final_probs).item())
labels = model.config.id2label
result = {
    "event": "group_f.cpu_inference.completed",
    "status": "PASS",
    "input": TEXT,
    "output": {"label": labels[label_id], "probabilities": {
        labels[i]: round(float(final_probs[i].item()), 6) for i in range(len(final_probs))
    }},
    "device": "cpu",
    "latency_samples_ms": [round(x, 3) for x in samples],
    "latency_p50_ms": round(latency_p50, 3),
    "model_id": MODEL_ID,
    "model_sha": model_sha,
    "transformers_source_sha": transformers_sha_runtime,
    "pytorch_source_sha": pytorch_sha_runtime,
    "torch_runtime_git_sha": torch.version.git_version,
    "tensorflow_installed": False,
    "jax_installed": False,
    "exit_code": 0,
}
print(json.dumps(result, ensure_ascii=False), flush=True)
