import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.SOUL_MESH_N01_PORT || process.env.PORT || 8080);
const HOST = process.env.SOUL_MESH_N01_HOST || '0.0.0.0';
const SECRET = process.env.SOUL_MESH_SECRET || '';
const VERSION = '1.0';
const PROTOCOL = 'soul-mesh/1';
const SELF = 'N01';
const TRANSPORTS = ['IN_PROCESS', 'WEBVIEW_BRIDGE', 'LOOPBACK_HTTP', 'HTTP', 'REALTIME'];
const PEER_IDS = ['N02', 'N03', 'N04', 'N05', 'N06'];
const peers = new Map();
const registrationTokens = new Map();
const seenNonces = new Map();
const failures = new Map();
const circuitOpenUntil = new Map();

function normalizeUrl(value) { return typeof value === 'string' ? value.trim().replace(/\/$/, '') : ''; }
function json(res, status, body) { const data = JSON.stringify(body); res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'}); res.end(data); }
function readBody(req) { return new Promise((resolve,reject)=>{ let raw=''; req.on('data',c=>{ raw+=c; if(raw.length>2_000_000){ req.destroy(); reject(new Error('PAYLOAD_TOO_LARGE')); }}); req.on('end',()=>{ try{resolve(raw?JSON.parse(raw):{});}catch{reject(new Error('INVALID_JSON'));} }); req.on('error',reject); }); }
function nonceCleanup(){ const now=Date.now(); for(const [n,t] of seenNonces) if(now-t>120_000) seenNonces.delete(n); }
function canonical(e){ const {hmac,...unsigned}=e; return JSON.stringify(unsigned); }
function hmacFor(e){ return crypto.createHmac('sha256',SECRET).update(canonical(e)).digest('hex'); }
function verifyEnvelope(e){
  if(!e || e.version!==VERSION || !e.messageId || !e.correlationId || !e.nonce || !e.source || !e.target || !e.type) throw new Error('INVALID_MESH_ENVELOPE');
  if(e.target!==SELF && e.target!=='BROADCAST') throw new Error('MESH_TARGET_MISMATCH');
  if(!Number.isFinite(e.timestamp) || Math.abs(Date.now()-e.timestamp)>30_000) throw new Error('MESH_TIMESTAMP_OUT_OF_RANGE');
  nonceCleanup(); if(seenNonces.has(e.nonce)) throw new Error('MESH_REPLAY_DETECTED');
  if(SECRET){ if(typeof e.hmac!=='string') throw new Error('MESH_HMAC_REQUIRED'); const expected=hmacFor(e); const actual=String(e.hmac); if(expected.length!==actual.length || !crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(actual))) throw new Error('MESH_HMAC_INVALID'); }
  seenNonces.set(e.nonce,Date.now());
}
function envelope({target,correlationId,type='TASK_RESULT',payload}) { const base={version:VERSION,messageId:crypto.randomUUID(),source:SELF,target,timestamp:Date.now(),nonce:crypto.randomUUID(),correlationId,type,payload}; return {...base,hmac:SECRET?hmacFor(base):''}; }
function canonicalMessage(target, capability, payload, correlationId){ return {protocol:PROTOCOL,id:crypto.randomUUID(),correlationId,source:SELF,target,kind:'request',capability,payload,timestamp:Date.now()}; }
function channelsFor(id){ return {in:PEER_IDS.filter(peer=>peer!==id).map(peer=>`${id}.IN.${peer}`),out:PEER_IDS.filter(peer=>peer!==id).map(peer=>`${id}.OUT.${peer}`)}; }
function capabilityList(){ return ['mesh.ping','mesh.health','mesh.discovery','mesh.register','mesh.heartbeat','mesh.delegate','mesh.fusion.describe','mesh.capabilities']; }
function localFusionSnapshot(){
  return { system:'SOUL', fusionVersion:'1.1', reference:'N01', protocol:PROTOCOL,
    nuclei:[SELF,...PEER_IDS].map(id=>({id,role:id===SELF?'host-reference-gateway':(peers.get(id)?.role||'independent-ai'),status:id===SELF?'online':(peers.get(id)?.status||'unknown'),endpoint:id===SELF?`http://${HOST}:${PORT}`:(peers.get(id)?.url||null),capabilities:id===SELF?capabilityList():(peers.get(id)?.capabilities||[]),channels:channelsFor(id)})),
    transports:TRANSPORTS,directionalChannels:60,ownership:'native-per-nucleus',fusion:'federated-independent-runtimes'};
}
function resolveOwner(capability){
  for(const peer of peers.values()) if(Array.isArray(peer.capabilities) && peer.capabilities.includes(capability)) return peer.id;
  if(capability?.startsWith('inference.')||capability?.startsWith('conversation.')) return 'N02';
  if(capability?.startsWith('audio.')||capability?.startsWith('multimodal.')) return 'N03';
  if(capability?.startsWith('document.')||capability?.startsWith('tool.')||capability?.startsWith('artifact.')) return 'N04';
  if(capability?.startsWith('orchestration.')||capability?.startsWith('dispatch.')) return 'N05';
  if(capability?.startsWith('pilot.')||capability?.startsWith('cognitive.')) return 'N06';
  return null;
}
async function forward(target,message){
  const peer=peers.get(target); if(!peer?.url) throw new Error(`PEER_NOT_DISCOVERED:${target}`);
  const until=circuitOpenUntil.get(target)||0; if(until>Date.now()) throw new Error(`PEER_CIRCUIT_OPEN:${target}`);
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),30_000);
  try{ const response=await fetch(peer.url+'/api/soul-mesh',{method:'POST',headers:{'content-type':'application/json','x-correlation-id':message.correlationId},body:JSON.stringify(message),signal:controller.signal,cache:'no-store'}); const body=await response.json().catch(()=>({})); if(!response.ok) throw new Error(`PEER_HTTP_${response.status}`); failures.set(target,0); peer.lastSeen=Date.now(); peer.status='healthy'; return body; }
  catch(error){ const count=(failures.get(target)||0)+1; failures.set(target,count); if(count>=5) circuitOpenUntil.set(target,Date.now()+60_000); throw error; }
  finally{ clearTimeout(timer); }
}
function bootstrapPeers(){
  const raw=process.env.SOUL_FUSION_PEERS || '';
  if(!raw) return;
  try{ const configured=JSON.parse(raw); for(const id of PEER_IDS){ const item=configured?.[id]; if(typeof item==='string'){ const url=normalizeUrl(item); if(url) peers.set(id,{id,url,capabilities:[],role:'independent-ai',lastSeen:0,status:'configured'}); } else if(item&&typeof item==='object'&&normalizeUrl(item.url)){ peers.set(id,{id,url:normalizeUrl(item.url),capabilities:Array.isArray(item.capabilities)?item.capabilities:[],role:typeof item.role==='string'?item.role:'independent-ai',lastSeen:0,status:'configured'}); } } }
  catch{ console.error('SOUL_FUSION_PEERS_INVALID_JSON'); }
}
function handle(req,res){
  return (async()=>{
    const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
    if(req.method==='GET'&&url.pathname==='/mesh/health') return json(res,200,{ok:true,nucleus:SELF,protocol:PROTOCOL,timestamp:Date.now(),capabilities:capabilityList(),peers:[...peers.values()].map(p=>({id:p.id,url:p.url,status:p.status,lastSeen:p.lastSeen}))});
    if(req.method==='GET'&&url.pathname==='/mesh/discovery') return json(res,200,{nucleus:SELF,protocol:PROTOCOL,capabilities:capabilityList(),peers:[...peers.values()]});
    if(req.method==='GET'&&(url.pathname==='/mesh/fusion'||url.pathname==='/api/soul-fusion')) return json(res,200,localFusionSnapshot());
    if(req.method==='POST'&&url.pathname==='/mesh/register'){ const body=await readBody(req); if(!/^N0[2-6]$/.test(body.nucleus)||!normalizeUrl(body.endpoint)) return json(res,400,{error:'INVALID_REGISTRATION'}); const id=body.nucleus; const token=crypto.randomUUID(); registrationTokens.set(id,token); peers.set(id,{id,url:normalizeUrl(body.endpoint),capabilities:Array.isArray(body.capabilities)?body.capabilities:[],role:typeof body.role==='string'?body.role:'independent-ai',lastSeen:Date.now(),status:'registered'}); return json(res,200,{ok:true,nucleus:SELF,registered:id,token,heartbeatIntervalMs:60_000,transports:TRANSPORTS}); }
    if(req.method==='POST'&&url.pathname==='/mesh/heartbeat'){ const body=await readBody(req); const id=body.nucleus; const expected=registrationTokens.get(id); const provided=(req.headers.authorization||'').replace(/^Bearer\s+/i,''); if(!/^N0[2-6]$/.test(id)||!expected||provided!==expected) return json(res,401,{error:'INVALID_HEARTBEAT_AUTH'}); const peer=peers.get(id); if(!peer) return json(res,404,{error:'PEER_NOT_REGISTERED'}); peer.lastSeen=Date.now(); peer.status='healthy'; if(normalizeUrl(body.endpoint)) peer.url=normalizeUrl(body.endpoint); if(Array.isArray(body.capabilities)) peer.capabilities=body.capabilities; return json(res,200,{ok:true,nucleus:SELF,peer:id,timestamp:Date.now()}); }
    if(req.method==='POST'&&(url.pathname==='/mesh/in'||url.pathname==='/mesh/out'||url.pathname==='/api/soul-mesh')){ try{ const message=await readBody(req); if(message.protocol===PROTOCOL){ if(message.target!==SELF) throw new Error('MESH_TARGET_MISMATCH'); if(!message.source||!/^N0[1-6]$/.test(message.source)||message.source===SELF||!message.correlationId) throw new Error('INVALID_SOUL_MESH_MESSAGE'); const capability=message.capability; const respond=(kind,payload,status=200)=>json(res,status,{protocol:PROTOCOL,id:crypto.randomUUID(),correlationId:message.correlationId,source:SELF,target:message.source,kind,capability,payload,timestamp:Date.now()}); if(capability==='mesh.ping') return respond('response',{ok:true,nucleus:SELF}); if(capability==='mesh.health') return respond('response',{ok:true,nucleus:SELF,peers:[...peers.keys()]}); if(capability==='mesh.discovery'||capability==='mesh.capabilities') return respond('response',{nucleus:SELF,capabilities:capabilityList(),peers:[...peers.values()],transports:TRANSPORTS,channels:channelsFor(SELF)}); if(capability==='mesh.fusion.describe') return respond('response',localFusionSnapshot()); if(capability==='mesh.register') return respond('response',{ok:true,registry:[...peers.keys()]}); if(capability==='mesh.heartbeat') return respond('response',{ok:true,timestamp:Date.now()}); if(capability==='mesh.delegate'){ const target=message.payload?.target; if(!/^N0[2-6]$/.test(target)) return respond('error',{code:'INVALID_DELEGATION_TARGET'},400); return json(res,200,await forward(target,canonicalMessage(target,message.payload?.capability||'mesh.ping',message.payload?.payload,message.correlationId))); } const owner=resolveOwner(capability); if(owner&&owner!==SELF) return json(res,200,await forward(owner,message)); return respond('error',{code:'CAPABILITY_NOT_IMPLEMENTED',capability},501); }
      verifyEnvelope(message); const capability=message.payload?.capability; if(capability==='mesh.ping'||message.type==='PING') return json(res,200,envelope({target:message.source,correlationId:message.correlationId,payload:{ok:true,nucleus:SELF}})); if(capability==='mesh.health') return json(res,200,envelope({target:message.source,correlationId:message.correlationId,payload:{ok:true,nucleus:SELF,peers:[...peers.keys()]}})); if(capability==='mesh.discovery'||capability==='mesh.capabilities'||capability==='mesh.fusion.describe') return json(res,200,envelope({target:message.source,correlationId:message.correlationId,payload:localFusionSnapshot()})); const owner=resolveOwner(capability); if(owner&&owner!==SELF) return json(res,200,await forward(owner,message)); return json(res,501,envelope({target:message.source,correlationId:message.correlationId,type:'ERROR',payload:{code:'CAPABILITY_NOT_IMPLEMENTED',capability}}));
    }catch(error){ return json(res,400,{ok:false,error:error instanceof Error?error.message:'MESH_ERROR'}); } }
    return json(res,404,{error:'NOT_FOUND'});
  })();
}
bootstrapPeers();
const server=http.createServer((req,res)=>handle(req,res).catch(error=>json(res,500,{ok:false,error:error instanceof Error?error.message:'INTERNAL_ERROR'})));
server.listen(PORT,HOST,()=>console.log(`SOUL N01 Mesh/Fusion listening on ${HOST}:${PORT}`));
process.on('SIGTERM',()=>server.close()); process.on('SIGINT',()=>server.close());
