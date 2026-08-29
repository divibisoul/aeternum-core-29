import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.SOUL_MESH_N01_PORT || process.env.PORT || 8080);
const HOST = process.env.SOUL_MESH_N01_HOST || '0.0.0.0';
const SECRET = process.env.SOUL_MESH_SECRET || '';
const VERSION = '1.0';
const SELF = 'N01';
const peers = new Map();
const seenNonces = new Map();
const failures = new Map();
const circuitOpenUntil = new Map();

for (const id of ['N02','N03','N04','N05','N06']) {
  const url = process.env[`SOUL_MESH_${id}_URL`];
  if (url) peers.set(id, { id, url: url.replace(/\/$/, ''), capabilities: [], lastSeen: 0, status: 'configured' });
}

function json(res, status, body) { const data = JSON.stringify(body); res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'}); res.end(data); }
function readBody(req) { return new Promise((resolve,reject)=>{ let raw=''; req.on('data',c=>{ raw+=c; if(raw.length>2_000_000){ req.destroy(); reject(new Error('PAYLOAD_TOO_LARGE')); }}); req.on('end',()=>{ try{resolve(raw?JSON.parse(raw):{});}catch{reject(new Error('INVALID_JSON'));} }); req.on('error',reject); }); }
function nonceCleanup(){ const now=Date.now(); for(const [n,t] of seenNonces) if(now-t>120_000) seenNonces.delete(n); }
function canonical(e){ const {hmac,...unsigned}=e; return JSON.stringify(unsigned); }
function hmacFor(e){ return crypto.createHmac('sha256',SECRET).update(canonical(e)).digest('hex'); }
function verifyEnvelope(e){
  if(!e || e.version!==VERSION || !e.messageId || !e.correlationId || !e.nonce || !e.source || !e.target || !e.type) throw new Error('INVALID_MESH_ENVELOPE');
  if(e.target!==SELF && e.target!=='BROADCAST') throw new Error('MESH_TARGET_MISMATCH');
  if(Math.abs(Date.now()-e.timestamp)>30_000) throw new Error('MESH_TIMESTAMP_OUT_OF_RANGE');
  nonceCleanup(); if(seenNonces.has(e.nonce)) throw new Error('MESH_REPLAY_DETECTED');
  if(SECRET){ if(typeof e.hmac!=='string') throw new Error('MESH_HMAC_REQUIRED'); const expected=hmacFor(e); const actual=String(e.hmac); if(expected.length!==actual.length || !crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(actual))) throw new Error('MESH_HMAC_INVALID'); }
  seenNonces.set(e.nonce,Date.now());
}
function envelope({target,correlationId,type='TASK_RESULT',payload}){
  const base={version:VERSION,messageId:crypto.randomUUID(),source:SELF,target,timestamp:Date.now(),nonce:crypto.randomUUID(),correlationId,type,payload};
  return {...base,hmac:SECRET?hmacFor(base):''};
}
function capabilityList(){ return ['mesh.ping','mesh.health','mesh.discovery','mesh.register','mesh.delegate','mesh.combo']; }
async function forward(target, message){
  const peer=peers.get(target); if(!peer?.url) throw new Error(`PEER_NOT_DISCOVERED:${target}`);
  const until=circuitOpenUntil.get(target)||0; if(until>Date.now()) throw new Error(`PEER_CIRCUIT_OPEN:${target}`);
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),30_000);
  try{
    const response=await fetch(peer.url+'/mesh/in',{method:'POST',headers:{'content-type':'application/json','x-correlation-id':message.correlationId},body:JSON.stringify(message),signal:controller.signal});
    const body=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(`PEER_HTTP_${response.status}`);
    failures.set(target,0); peer.lastSeen=Date.now(); peer.status='healthy'; return body;
  }catch(error){ const count=(failures.get(target)||0)+1; failures.set(target,count); if(count>=5) circuitOpenUntil.set(target,Date.now()+60_000); throw error; } finally { clearTimeout(timer); }
}
async function handle(req,res){
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(req.method==='GET' && url.pathname==='/mesh/health') return json(res,200,{ok:true,nucleus:SELF,protocol:'soul-mesh/1',timestamp:Date.now(),capabilities:capabilityList(),peers:[...peers.values()].map(p=>({id:p.id,url:p.url,status:p.status,lastSeen:p.lastSeen}))});
  if(req.method==='GET' && url.pathname==='/mesh/discovery') return json(res,200,{nucleus:SELF,protocol:'soul-mesh/1',capabilities:capabilityList(),peers:[...peers.values()]});
  if(req.method==='POST' && url.pathname==='/mesh/register'){
    const body=await readBody(req); if(!/^N0[1-6]$/.test(body.nucleus)||!body.endpoint) return json(res,400,{error:'INVALID_REGISTRATION'});
    peers.set(body.nucleus,{id:body.nucleus,url:String(body.endpoint).replace(/\/$/,''),capabilities:Array.isArray(body.capabilities)?body.capabilities:[],lastSeen:Date.now(),status:'registered'});
    return json(res,200,{ok:true,nucleus:SELF,registered:body.nucleus,token:crypto.randomUUID(),heartbeatIntervalMs:60_000});
  }
  if(req.method==='POST' && (url.pathname==='/mesh/in'||url.pathname==='/mesh/out')){
    try{
      const message=await readBody(req); verifyEnvelope(message);
      const capability=message.payload?.capability;
      if(message.type==='PING'||capability==='mesh.ping') return json(res,200,envelope({target:message.source,correlationId:message.correlationId,payload:{ok:true,nucleus:SELF}}));
      if(capability==='mesh.health') return json(res,200,envelope({target:message.source,correlationId:message.correlationId,payload:{ok:true,nucleus:SELF,peers:[...peers.keys()]}}));
      if(capability==='mesh.discovery') return json(res,200,envelope({target:message.source,correlationId:message.correlationId,payload:{nucleus:SELF,capabilities:capabilityList(),peers:[...peers.values()]}}));
      if(capability==='mesh.register') return json(res,200,envelope({target:message.source,correlationId:message.correlationId,payload:{ok:true,registry:[...peers.keys()]}}));
      if(capability==='mesh.delegate'){
        const target=message.payload?.payload?.target;
        if(!/^N0[2-6]$/.test(target)) return json(res,400,envelope({target:message.source,correlationId:message.correlationId,type:'ERROR',payload:{code:'INVALID_DELEGATION_TARGET'}}));
        const delegated={...message,target,source:SELF,payload:message.payload.payload.request};
        return json(res,200,await forward(target,delegated));
      }
      if(capability==='mesh.combo'){
        const steps=message.payload?.payload?.steps;
        if(!Array.isArray(steps)||steps.length===0||steps.length>12) return json(res,400,envelope({target:message.source,correlationId:message.correlationId,type:'ERROR',payload:{code:'INVALID_COMBO'}}));
        let value=message.payload.payload.input; const trace=[];
        for(const step of steps){ if(!/^N0[2-6]$/.test(step.target)||typeof step.capability!=='string') throw new Error('INVALID_COMBO_STEP'); const request={...message,messageId:crypto.randomUUID(),source:SELF,target:step.target,type:'CAPABILITY_REQUEST',payload:{capability:step.capability,payload:value}}; const result=await forward(step.target,request); value=result?.payload?.result ?? result?.payload ?? result; trace.push({target:step.target,capability:step.capability,correlationId:result?.correlationId||message.correlationId}); }
        return json(res,200,envelope({target:message.source,correlationId:message.correlationId,payload:{ok:true,nucleus:SELF,result:value,trace}}));
      }
      const owner = capability?.startsWith('inference.')?'N05':capability?.startsWith('conversation.')?'N05':capability?.startsWith('document.')?'N04':capability?.startsWith('audio.')?'N03':capability?.startsWith('tool.')?'N04':null;
      if(owner && owner!==SELF) return json(res,200,await forward(owner,{...message,source:SELF,target:owner}));
      return json(res,501,envelope({target:message.source,correlationId:message.correlationId,type:'ERROR',payload:{code:'CAPABILITY_NOT_IMPLEMENTED',capability}}));
    }catch(error){ return json(res,400,{ok:false,error:error instanceof Error?error.message:'MESH_ERROR'}); }
  }
  return json(res,404,{error:'NOT_FOUND'});
}

const server=http.createServer((req,res)=>handle(req,res).catch(error=>json(res,500,{ok:false,error:error instanceof Error?error.message:'INTERNAL_ERROR'})));
server.listen(PORT,HOST,()=>console.log(`SOUL N01 Mesh listening on ${HOST}:${PORT}`));
process.on('SIGTERM',()=>server.close()); process.on('SIGINT',()=>server.close());
