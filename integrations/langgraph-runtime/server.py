from __future__ import annotations
import json, os, time, urllib.error, urllib.request, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, TypedDict
from langgraph.graph import END, START, StateGraph
LANGGRAPH_SHA=os.environ.get("LANGGRAPH_UPSTREAM_SHA","1400d25b7b88cfa055c55b8a82bd95b7c25caef1")
TOKEN=os.environ.get("SOUL_FUSION_MODEL_TOKEN","")
LOCAL_MODEL_URL=os.environ.get("SOUL_LOCAL_MODEL_URL","http://127.0.0.1:18071").rstrip("/")
MAX_BODY_BYTES=32768
class State(TypedDict,total=False):
    text:str; trace_id:str; correlation_id:str; authorization:dict[str,Any]
    prepared_text:str; model_response:dict[str,Any]; intent:str; summary:str
def prepare(state:State)->dict[str,Any]:
    text=state.get("text","");trace=state.get("trace_id","");corr=state.get("correlation_id","");auth=state.get("authorization",{})
    if not isinstance(text,str) or not text.strip() or len(text)>8000: raise ValueError("GRAPH_INPUT_INVALID")
    if not trace or trace!=corr: raise ValueError("GRAPH_TRACE_CORRELATION_MISMATCH")
    if (auth.get("status")!="authorized" or auth.get("nucleus_id")!="N07" or auth.get("capability")!="mesh.ping"
        or auth.get("trace_id")!=trace or auth.get("correlation_id")!=corr): raise ValueError("N07_AUTHORIZATION_CONTEXT_INVALID")
    print(json.dumps({"event":"langgraph.node.completed","node":"prepare","trace_id":trace,"correlation_id":corr,"authorization":"N07"}),flush=True)
    return {"prepared_text":text}
def execute(state:State)->dict[str,Any]:
    trace=state["trace_id"];corr=state["correlation_id"]
    data=json.dumps({"text":state["prepared_text"],"trace_id":trace,"correlation_id":corr},separators=(",",":"),ensure_ascii=False).encode()
    req=urllib.request.Request(LOCAL_MODEL_URL+"/v1/infer",data=data,method="POST",headers={"Authorization":"Bearer "+TOKEN,"Content-Type":"application/json","X-Soul-Trace-Id":trace,"X-Correlation-Id":corr})
    started=time.perf_counter()
    try:
        with urllib.request.urlopen(req,timeout=60) as response:
            decoded=json.loads(response.read(MAX_BODY_BYTES+1).decode());status=int(response.status)
    except urllib.error.HTTPError as exc: raise RuntimeError(f"LOCAL_MODEL_HTTP_{exc.code}:{exc.read(4096).decode(errors='replace')}") from exc
    except urllib.error.URLError as exc: raise RuntimeError(f"LOCAL_MODEL_TRANSPORT:{exc.reason}") from exc
    if status<200 or status>=300: raise RuntimeError(f"LOCAL_MODEL_HTTP_{status}")
    if decoded.get("trace_id")!=trace or decoded.get("correlation_id")!=corr: raise RuntimeError("LOCAL_MODEL_TRACE_CORRELATION_MISMATCH")
    if decoded.get("provider")!="local-transformers-pytorch" or not decoded.get("model_sha"): raise RuntimeError("LOCAL_MODEL_PROVIDER_OR_SHA_INVALID")
    result=decoded.get("result")
    if not isinstance(result,dict) or not result.get("label") or not result.get("summary"): raise RuntimeError("LOCAL_MODEL_RESULT_INVALID")
    print(json.dumps({"event":"langgraph.node.completed","node":"execute","trace_id":trace,"correlation_id":corr,"provider":decoded["provider"],"model_sha":decoded["model_sha"],"label":result["label"],"latency_ms":round((time.perf_counter()-started)*1000,3)}),flush=True)
    return {"model_response":decoded,"intent":result["intent"],"summary":result["summary"]}
builder=StateGraph(State);builder.add_node("prepare",prepare);builder.add_node("execute",execute)
builder.add_edge(START,"prepare");builder.add_edge("prepare","execute");builder.add_edge("execute",END);GRAPH=builder.compile()
def send_json(h:BaseHTTPRequestHandler,status:int,obj:dict[str,Any])->None:
    b=json.dumps(obj,separators=(",",":"),ensure_ascii=False).encode();h.send_response(status)
    h.send_header("Content-Type","application/json; charset=utf-8");h.send_header("Cache-Control","no-store")
    h.send_header("Content-Length",str(len(b)));h.end_headers();h.wfile.write(b)
class Handler(BaseHTTPRequestHandler):
    def log_message(self,fmt:str,*args:Any)->None: return
    def do_GET(self)->None:
        if self.path!="/health": send_json(self,404,{"error":"NOT_FOUND"});return
        send_json(self,200,{"ready":True,"provider":"langgraph","upstream_sha":LANGGRAPH_SHA,"graph_nodes":["prepare","execute"],"local_model_url":LOCAL_MODEL_URL})
    def do_POST(self)->None:
        if self.path!="/v1/infer": send_json(self,404,{"error":"NOT_FOUND"});return
        if not TOKEN or self.headers.get("Authorization","")!="Bearer "+TOKEN: send_json(self,401,{"error":"UNAUTHORIZED"});return
        req={}
        try:
            n=int(self.headers.get("Content-Length","0"))
            if n<=0 or n>MAX_BODY_BYTES: raise ValueError("REQUEST_SIZE_INVALID")
            req=json.loads(self.rfile.read(n));trace=str(req.get("trace_id",""));corr=str(req.get("correlation_id",""));auth=req.get("authorization",{})
            if not trace or trace!=corr or trace!=self.headers.get("X-Soul-Trace-Id") or corr!=self.headers.get("X-Correlation-Id"): raise ValueError("TRACE_CORRELATION_CONTRACT_INVALID")
            started=time.perf_counter()
            print(json.dumps({"event":"langgraph.started","trace_id":trace,"correlation_id":corr,"upstream_sha":LANGGRAPH_SHA,"nodes":["prepare","execute"]}),flush=True)
            graph=GRAPH.invoke({"text":req.get("text",""),"trace_id":trace,"correlation_id":corr,"authorization":auth})
            mr=graph["model_response"];result=mr["result"];elapsed=(time.perf_counter()-started)*1000
            out={"contract_name":"soul-fusion-execution","schema_version":"0.1.0","message_id":str(uuid.uuid4()),"trace_id":trace,"correlation_id":corr,
              "provider":mr["provider"],"model":mr["model"],"model_sha":mr["model_sha"],"result":result,"latency_ms":round(elapsed,3),
              "graph_nodes_executed":["prepare","execute"],"langgraph_upstream_sha":LANGGRAPH_SHA}
            print(json.dumps({"event":"langgraph.completed","status":"SUCCEEDED","trace_id":trace,"correlation_id":corr,"graph_nodes_executed":out["graph_nodes_executed"],"provider":out["provider"],"model_sha":out["model_sha"],"latency_ms":out["latency_ms"]}),flush=True)
            send_json(self,200,out)
        except Exception as exc:
            print(json.dumps({"event":"langgraph.failed","error":str(exc),"trace_id":str(req.get("trace_id",""))}),flush=True);send_json(self,400,{"error":str(exc)})
if __name__=="__main__":
    print(json.dumps({"event":"langgraph.ready","host":"0.0.0.0","port":18070,"upstream_sha":LANGGRAPH_SHA,"graph_nodes":["prepare","execute"]}),flush=True)
    ThreadingHTTPServer(("0.0.0.0",18070),Handler).serve_forever()
