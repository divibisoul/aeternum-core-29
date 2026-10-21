from __future__ import annotations
import argparse, hashlib, importlib.util, json, os, subprocess, time, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
os.environ.setdefault("TRANSFORMERS_NO_TF","1"); os.environ.setdefault("USE_TF","0"); os.environ.setdefault("USE_FLAX","0")
for module in ("tensorflow","jax","flax"):
    if importlib.util.find_spec(module) is not None: raise SystemExit("FORBIDDEN_FRAMEWORK_INSTALLED:"+module)
import torch
from huggingface_hub import model_info
from transformers import AutoModelForSequenceClassification, AutoTokenizer
MODEL_ID=os.environ.get("SOUL_LOCAL_MODEL_ID","distilbert/distilbert-base-uncased-finetuned-sst-2-english")
TRANSFORMERS_SOURCE_SHA=os.environ.get("TRANSFORMERS_SOURCE_SHA","6f2e80bdad560947903bb4bde8043ae95387069a")
PYTORCH_PINNED_SOURCE_SHA=os.environ.get("PYTORCH_SOURCE_SHA","a84b7baa33f893ab92176c08a85b14455e60b2fc")
TOKEN=os.environ.get("SOUL_FUSION_MODEL_TOKEN","").strip(); HOST=os.environ.get("SOUL_LOCAL_MODEL_HOST","0.0.0.0")
PORT=int(os.environ.get("SOUL_LOCAL_MODEL_PORT","18071")); DEFAULT_TEXT="The movie was excellent and the acting was wonderful."
transformers_sha_runtime=subprocess.check_output(["git","-C","/opt/transformers","rev-parse","HEAD"],text=True).strip()
pytorch_repo_sha=subprocess.check_output(["git","-C","/opt/pytorch","rev-parse","FETCH_HEAD"],text=True).strip()
if transformers_sha_runtime!=TRANSFORMERS_SOURCE_SHA: raise SystemExit("TRANSFORMERS_SOURCE_SHA_MISMATCH")
if pytorch_repo_sha!=PYTORCH_PINNED_SOURCE_SHA: raise SystemExit("PYTORCH_SOURCE_SHA_MISMATCH")
MODEL_SHA=os.environ.get("SOUL_LOCAL_MODEL_SHA","").strip()
if not MODEL_SHA: MODEL_SHA=str(model_info(MODEL_ID).sha or "").strip()
if len(MODEL_SHA)!=40: raise SystemExit("MODEL_REVISION_SHA_MISSING_OR_INVALID")
torch.set_num_threads(max(1,min(2,torch.get_num_threads())))
tokenizer=AutoTokenizer.from_pretrained(MODEL_ID,revision=MODEL_SHA)
model=AutoModelForSequenceClassification.from_pretrained(MODEL_ID,revision=MODEL_SHA).to("cpu"); model.eval()
LABELS={int(k):str(v) for k,v in model.config.id2label.items()}
def infer(text:str,trace_id:str,correlation_id:str)->dict[str,Any]:
    if not isinstance(text,str) or not text.strip() or len(text)>8000: raise ValueError("INFERENCE_TEXT_INVALID")
    if not trace_id or trace_id!=correlation_id: raise ValueError("TRACE_CORRELATION_MISMATCH")
    start=time.perf_counter(); tokens=tokenizer(text,return_tensors="pt",truncation=True,max_length=256)
    with torch.inference_mode(): output=model(**tokens); probs=torch.softmax(output.logits,dim=-1)[0]
    latency=(time.perf_counter()-start)*1000; ix=int(torch.argmax(probs).item()); label=LABELS[ix]
    probability_map={LABELS[i]:round(float(probs[i].item()),6) for i in range(len(probs))}
    confidence=round(float(probs[ix].item()),6)
    summary=f"DistilBERT CPU sentiment inference: {label} (confidence={confidence:.6f})."
    result={"intent":label.lower(),"label":label,"confidence":confidence,"probabilities":probability_map,"summary":summary,
      "model_sha":MODEL_SHA,"input_sha256":hashlib.sha256(text.encode("utf-8")).hexdigest()}
    print(json.dumps({"event":"group_f.inference.completed","trace_id":trace_id,"correlation_id":correlation_id,
      "provider":"local-transformers-pytorch","model_id":MODEL_ID,"model_sha":MODEL_SHA,"pytorch_pinned_source_sha":PYTORCH_PINNED_SOURCE_SHA,
      "torch_version":torch.__version__,"torch_runtime_git_sha":torch.version.git_version,"device":"cpu","latency_ms":round(latency,3),
      "label":label,"confidence":confidence}),flush=True)
    return {"contract_name":"soul-fusion-execution","schema_version":"0.1.0","message_id":"local-"+uuid.uuid4().hex,
      "trace_id":trace_id,"correlation_id":correlation_id,"provider":"local-transformers-pytorch","model":f"{MODEL_ID}@{MODEL_SHA}",
      "model_sha":MODEL_SHA,"result":result,"latency_ms":round(latency,3)}
def send_json(handler:BaseHTTPRequestHandler,status:int,obj:dict[str,Any])->None:
    data=json.dumps(obj,separators=(",",":"),ensure_ascii=False).encode()
    handler.send_response(status); handler.send_header("Content-Type","application/json; charset=utf-8")
    handler.send_header("Cache-Control","no-store"); handler.send_header("Content-Length",str(len(data)))
    handler.end_headers(); handler.wfile.write(data)
class Handler(BaseHTTPRequestHandler):
    def log_message(self,fmt:str,*args:Any)->None: return
    def do_GET(self)->None:
        if self.path!="/health": send_json(self,404,{"error":"NOT_FOUND"});return
        send_json(self,200,{"ready":True,"provider":"local-transformers-pytorch","model_id":MODEL_ID,"model_sha":MODEL_SHA,"device":"cpu",
          "transformers_source_sha":transformers_sha_runtime,"pytorch_pinned_source_sha":pytorch_repo_sha,"torch_runtime_git_sha":torch.version.git_version,
          "tensorflow_installed":importlib.util.find_spec("tensorflow") is not None,"jax_installed":importlib.util.find_spec("jax") is not None})
    def do_POST(self)->None:
        if self.path!="/v1/infer": send_json(self,404,{"error":"NOT_FOUND"});return
        if not TOKEN or self.headers.get("Authorization","")!="Bearer "+TOKEN: send_json(self,401,{"error":"UNAUTHORIZED"});return
        request={}
        try:
            size=int(self.headers.get("Content-Length","0"))
            if size<=0 or size>32768: raise ValueError("REQUEST_SIZE_INVALID")
            request=json.loads(self.rfile.read(size)); trace=str(request.get("trace_id","")); corr=str(request.get("correlation_id",""))
            if not trace or trace!=corr or trace!=self.headers.get("X-Soul-Trace-Id") or corr!=self.headers.get("X-Correlation-Id"):
                raise ValueError("TRACE_CORRELATION_CONTRACT_INVALID")
            send_json(self,200,infer(str(request.get("text","")),trace,corr))
        except Exception as exc:
            print(json.dumps({"event":"group_f.inference.failed","error":str(exc),"trace_id":request.get("trace_id","")}),flush=True)
            send_json(self,400,{"error":str(exc)})
def compile_smoke()->int:
    trace=uuid.uuid4().hex
    tokens=tokenizer(DEFAULT_TEXT,return_tensors="pt",truncation=True,max_length=256)
    with torch.inference_mode(): expected=model(**tokens).logits.detach()
    started=time.perf_counter()
    compiled=torch.compile(model,backend="inductor",fullgraph=False)
    with torch.inference_mode(): actual=compiled(**tokens).logits.detach()
    elapsed=(time.perf_counter()-started)*1000
    torch.testing.assert_close(actual,expected,rtol=1e-4,atol=1e-4)
    event={"event":"group_f.torch_compile.cpu_smoke","status":"PASS","backend":"inductor","device":"cpu",
        "model_id":MODEL_ID,"model_sha":MODEL_SHA,"torch_version":torch.__version__,
        "latency_ms":round(elapsed,3),"output_equivalent":True,"trace_id":trace,"exit_code":0}
    print(json.dumps(event),flush=True)
    return 0

def self_test()->int:
    trace=uuid.uuid4().hex; response=infer(DEFAULT_TEXT,trace,trace)
    print(json.dumps({"event":"group_f.cpu_inference.self_test","status":"PASS","input":DEFAULT_TEXT,"output":response["result"],
      "model_id":MODEL_ID,"model_sha":MODEL_SHA,"provider":response["provider"],"device":"cpu","torch_version":torch.__version__,
      "torch_runtime_git_sha":torch.version.git_version,"transformers_source_sha":transformers_sha_runtime,"pytorch_pinned_source_sha":pytorch_repo_sha,
      "tensorflow_installed":False,"jax_installed":False,"exit_code":0},ensure_ascii=False),flush=True)
    return 0
if __name__=="__main__":
    parser=argparse.ArgumentParser(); parser.add_argument("--self-test",action="store_true"); parser.add_argument("--compile-smoke",action="store_true"); parser.add_argument("--serve",action="store_true")
    args=parser.parse_args()
    print(json.dumps({"event":"group_f.model.loaded","model_id":MODEL_ID,"model_sha":MODEL_SHA,"provider":"local-transformers-pytorch","device":"cpu",
      "transformers_source_sha":transformers_sha_runtime,"pytorch_pinned_source_sha":pytorch_repo_sha,"torch_version":torch.__version__,
      "torch_runtime_git_sha":torch.version.git_version,"tensorflow_installed":importlib.util.find_spec("tensorflow") is not None,
      "jax_installed":importlib.util.find_spec("jax") is not None}),flush=True)
    if args.self_test: raise SystemExit(self_test())
    if args.compile_smoke: raise SystemExit(compile_smoke())
    if not TOKEN: raise SystemExit("SOUL_FUSION_MODEL_TOKEN_REQUIRED")
    print(json.dumps({"event":"group_f.model.listening","host":HOST,"port":PORT,"model_sha":MODEL_SHA}),flush=True)
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
