from __future__ import annotations
import json
import os
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import TypedDict, Any
from langgraph.graph import END, START, StateGraph

LANGGRAPH_SHA = os.environ.get("LANGGRAPH_UPSTREAM_SHA", "1400d25b7b88cfa055c55b8a82bd95b7c25caef1")
TOKEN = os.environ.get("SOUL_FUSION_MODEL_TOKEN", "")

class State(TypedDict, total=False):
    text: str
    trace_id: str
    correlation_id: str
    normalized_text: str
    summary: str
    intent: str

def prepare(state: State) -> dict[str, Any]:
    text = state.get("text", "").strip()
    trace = state.get("trace_id", "")
    correlation = state.get("correlation_id", "")
    if not text or not trace or not correlation or trace != correlation:
        raise ValueError("TRACE_OR_INPUT_CONTRACT_INVALID")
    return {"normalized_text": " ".join(text.split()), "intent": "integration_verification"}

def execute(state: State) -> dict[str, Any]:
    snippet = state["normalized_text"][:220]
    summary = "LangGraph executed a two-node graph after the real N01-to-N07 neural authorization. Input summary: " + snippet
    return {"summary": summary}

builder = StateGraph(State)
builder.add_node("prepare", prepare)
builder.add_node("execute", execute)
builder.add_edge(START, "prepare")
builder.add_edge("prepare", "execute")
builder.add_edge("execute", END)
GRAPH = builder.compile()

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return
    def send_json(self, status: int, value: dict[str, Any]):
        body = json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def do_GET(self):
        if self.path != "/health":
            self.send_json(404, {"error":"NOT_FOUND"})
            return
        self.send_json(200, {"ready": True, "provider":"langgraph", "upstream_sha":LANGGRAPH_SHA, "graph_nodes":["prepare","execute"]})
    def do_POST(self):
        if self.path != "/v1/infer":
            self.send_json(404, {"error":"NOT_FOUND"})
            return
        auth = self.headers.get("Authorization", "")
        if not TOKEN or auth != "Bearer " + TOKEN:
            self.send_json(401, {"error":"UNAUTHORIZED"})
            return
        try:
            length=int(self.headers.get("Content-Length","0"))
            if length<=0 or length>32768: raise ValueError("REQUEST_SIZE_INVALID")
            req=json.loads(self.rfile.read(length))
            trace=str(req.get("trace_id",""))
            correlation=str(req.get("correlation_id",""))
            if (not trace or trace != correlation or trace != self.headers.get("X-Soul-Trace-Id")
                or correlation != self.headers.get("X-Correlation-Id") or not isinstance(req.get("text"),str)):
                raise ValueError("TRACE_CORRELATION_CONTRACT_INVALID")
            start=time.perf_counter()
            print(json.dumps({"event":"langgraph.started","trace_id":trace,"correlation_id":correlation,"upstream_sha":LANGGRAPH_SHA,"nodes":["prepare","execute"]}),flush=True)
            graph=GRAPH.invoke({"text":req["text"],"trace_id":trace,"correlation_id":correlation})
            elapsed=(time.perf_counter()-start)*1000
            output={"contract_name":"soul-fusion-execution","schema_version":"0.1.0",
                "message_id":"langgraph-"+trace[:24],"trace_id":trace,"correlation_id":correlation,
                "provider":"langgraph","model":"langgraph@"+LANGGRAPH_SHA,
                "result":{"intent":graph["intent"],"summary":graph["summary"],"capabilities":["stateful-two-node-graph"],"confidence":1.0},
                "latency_ms":round(elapsed,3)}
            print(json.dumps({"event":"langgraph.completed","status":"SUCCEEDED","trace_id":trace,"correlation_id":correlation,"nodes_executed":["prepare","execute"],"latency_ms":round(elapsed,3),"upstream_sha":LANGGRAPH_SHA}),flush=True)
            self.send_json(200,output)
        except Exception as exc:
            print(json.dumps({"event":"langgraph.failed","error":str(exc)}),flush=True)
            self.send_json(400,{"error":str(exc)})
        
if __name__ == "__main__":
    print(json.dumps({"event":"langgraph.ready","host":"0.0.0.0","port":18070,"upstream_sha":LANGGRAPH_SHA}),flush=True)
    ThreadingHTTPServer(("0.0.0.0",18070),Handler).serve_forever()
