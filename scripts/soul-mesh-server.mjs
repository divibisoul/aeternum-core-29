import http from 'node:http';
import crypto from 'node:crypto';
import { createSuperGPU } from './soul-supergpu.mjs';
import { inferInitialIntent } from './n01-byok-gemini.mjs';
import { buildCognitiveDelegationPayload } from './n01-cognitive-delegation.mjs';
import { requestSara, saraConfigured, saraHealthConfigured, saraDescribe } from './sara-federation.mjs';
import { N01_RESIDENT_AGENT } from './soul-resident-agent.mjs';

const PORT = Number(process.env.SOUL_MESH_N01_PORT || process.env.PORT || 8080);
const HOST = process.env.SOUL_MESH_N01_HOST || '0.0.0.0';
const SECRET = process.env.SOUL_MESH_SECRET || '';
const VERSION = '1.0';
const PROTOCOL = 'soul-mesh/1';
const CONTRACT_VERSION = '1.1.0';
const SELF = 'N01';
const FUSION_VERSION = '1.4';
const TRANSPORTS = ['IN_PROCESS', 'WEBVIEW_BRIDGE', 'LOOPBACK_HTTP', 'HTTP', 'REALTIME'];
const PEER_IDS = ['N02', 'N03', 'N04', 'N05', 'N06', 'N07'];
const NUCLEUS_IDS = [SELF, ...PEER_IDS];
const ACTIVE_AI_IDS = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'];
const peers = new Map();
const registrationTokens = new Map();
const seenNonces = new Map();
const failures = new Map();
const circuitOpenUntil = new Map();
const CLAREIRA_MAX_QUEUE_SIZE = 100;
const clareiraIngress = { ingested: 0, dropped: 0, errored: 0, queue: [] };
function isClareiraPacket(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const p = value;
  return typeof p.id === 'string' && p.id.length > 0 && typeof p.data === 'string'
    && Number.isFinite(p.informationalValue)
    && Number.isFinite(p.criticality) && p.criticality >= 0 && p.criticality <= 1
    && ['Data','StateReport','DecisionRequest','DecisionResponse','Control','Heartbeat'].includes(p.packetType)
    && typeof p.sourceId === 'string' && p.sourceId.length > 0
    && (p.destinationHint === undefined || typeof p.destinationHint === 'string')
    && Number.isFinite(p.timestamp) && typeof p.correlationId === 'string' && p.correlationId.length > 0
    && p.metadata && typeof p.metadata === 'object' && !Array.isArray(p.metadata);
}
function clareiraMetrics() {
  return {
    capturedAtMs: Date.now(), contractVersion: '1.0.0', ingressOnly: true,
    packets: { ingested: clareiraIngress.ingested, processed: 0, dropped: clareiraIngress.dropped, errored: clareiraIngress.errored, inFlight: clareiraIngress.queue.length },
    queue: { size: clareiraIngress.queue.length, capacity: CLAREIRA_MAX_QUEUE_SIZE },
  };
}

function normalizeUrl(value) { return typeof value === 'string' ? value.trim().replace(/\/$/, '') : ''; }
function json(res, status, body) { const data = JSON.stringify(body); res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'}); res.end(data); }
function readBody(req) { return new Promise((resolve,reject)=>{ let raw=''; req.on('data',c=>{ raw+=c; if(raw.length>2_000_000){ req.destroy(); reject(new Error('PAYLOAD_TOO_LARGE')); }}); req.on('end',()=>{ try{resolve(raw?JSON.parse(raw):{});}catch{reject(new Error('INVALID_JSON'));} }); req.on('error',reject); }); }
function nonceCleanup(){ const now=Date.now(); for(const [n,t] of seenNonces) if(now-t>120_000) seenNonces.delete(n); }
function canonical(e){ const {hmac,...unsigned}=e; return JSON.stringify(unsigned); }
function hmacFor(e){ return crypto.createHmac('sha256',SECRET).update(canonical(e)).digest('hex'); }
function canonicalProtocol(e,nonce){ return JSON.stringify({
  protocol:e.protocol, contractVersion:e.contractVersion, id:e.id, correlationId:e.correlationId,
  source:e.source, target:e.target, kind:e.kind, capability:e.capability??null, payload:e.payload,
  timestamp:e.timestamp, transport:e.meta?.transport, meta:e.meta??null, nonce
}); }
function canonicalLegacyResponse(body,nonce){ return JSON.stringify({
  version:'1.0', contractVersion:body.contractVersion, messageId:body.id, source:body.source,
  target:body.target, timestamp:body.timestamp, nonce, correlationId:body.correlationId,
  type:body.kind==='error'?'ERROR':'TASK_RESULT',
  payload:{capability:body.capability??'',payload:body.payload??{}}
}); }
function protocolHmacFor(body,nonce=body.nonce??body.meta?.nonce){ return crypto.createHmac('sha256',SECRET).update(canonicalProtocol(body,nonce),'utf8').digest('hex'); }
function protocolResponse(body,nonce=body.nonce??body.meta?.nonce){ 
  if(!SECRET)return body;
  return {...body,nonce,hmac:crypto.createHmac('sha256',SECRET).update(canonicalLegacyResponse(body,nonce),'utf8').digest('hex')};
}
function verifyProtocolEnvelope(e,req){
  if(!SECRET)return;
  const nonce=String(req.headers['x-soul-mesh-nonce']||e.nonce||e.meta?.nonce||'').trim();
  const headerNonce=String(req.headers['x-soul-mesh-nonce']||'').trim();
  const supplied=String(req.headers['x-soul-mesh-hmac']||'').trim();
  if(!nonce || (headerNonce && headerNonce!==nonce) || !/^[0-9a-f]{64}$/i.test(supplied))throw new Error('MESH_HMAC_INVALID');
  nonceCleanup();
  if(seenNonces.has(nonce))throw new Error('MESH_REPLAY_DETECTED');
  const expected=protocolHmacFor(e,nonce);
  const actual=Buffer.from(supplied,'hex'), wanted=Buffer.from(expected,'hex');
  if(actual.length!==wanted.length || !crypto.timingSafeEqual(actual,wanted))throw new Error('MESH_HMAC_INVALID');
  seenNonces.set(nonce,Date.now());
}
function verifyEnvelope(e){
  if(!e || e.version!==VERSION || !e.messageId || !e.correlationId || !e.nonce || !e.source || !e.target || !e.type) throw new Error('INVALID_MESH_ENVELOPE');
  if(e.target!==SELF && e.target!=='BROADCAST') throw new Error('MESH_TARGET_MISMATCH');
  if(!Number.isFinite(e.timestamp) || Math.abs(Date.now()-e.timestamp)>30_000) throw new Error('MESH_TIMESTAMP_OUT_OF_RANGE');
  nonceCleanup(); if(seenNonces.has(e.nonce)) throw new Error('MESH_REPLAY_DETECTED');
  if(SECRET){ if(typeof e.hmac!=='string') throw new Error('MESH_HMAC_REQUIRED'); const expected=hmacFor(e); const actual=String(e.hmac); if(expected.length!==actual.length || !crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(actual))) throw new Error('MESH_HMAC_INVALID'); }
  seenNonces.set(e.nonce,Date.now());
}
function envelope({target,correlationId,type='TASK_RESULT',payload}) { const base={version:VERSION,messageId:crypto.randomUUID(),source:SELF,target,timestamp:Date.now(),nonce:crypto.randomUUID(),correlationId,type,payload}; return {...base,hmac:SECRET?hmacFor(base):''}; }
function canonicalMessage(target, capability, payload, correlationId){ return {protocol:PROTOCOL,contractVersion:CONTRACT_VERSION,id:crypto.randomUUID(),correlationId:correlationId||crypto.randomUUID(),source:SELF,target,kind:'request',capability,payload,timestamp:Date.now()}; }
function channelsFor(id){ const peersFor=NUCLEUS_IDS.filter(nucleus=>nucleus!==id); return {in:peersFor.map(peer=>`${id}.IN.${peer}`),out:peersFor.map(peer=>`${id}.OUT.${peer}`)}; }
function topologyCounts(){ const activeAIDirectedRoutes=ACTIVE_AI_IDS.length*(ACTIVE_AI_IDS.length-1); const totalLogicalDirectedRoutes=NUCLEUS_IDS.length*(NUCLEUS_IDS.length-1); const structuralN07AdditionalDirectedRoutes=totalLogicalDirectedRoutes-activeAIDirectedRoutes; return {activeAINuclei:ACTIVE_AI_IDS.length,activeAIDirectedRoutes,activeAIEndpointSurfaces:activeAIDirectedRoutes*2,structuralN07AdditionalDirectedRoutes,structuralN07AdditionalEndpointSurfaces:structuralN07AdditionalDirectedRoutes*2,totalIdentityNuclei:NUCLEUS_IDS.length,totalLogicalDirectedRoutes,totalEndpointSurfaces:totalLogicalDirectedRoutes*2,topologyState:'LOGICAL_UNVERIFIED'}; }
function capabilityList(){ return ['clareira.ingest','clareira.metrics','inference.intent','mesh.ping','mesh.health','mesh.discovery','mesh.register','mesh.heartbeat','mesh.delegate','mesh.capabilities','mesh.resident.describe@1.0.0','mesh.fusion.describe','mesh.capability.resolve','mesh.fusion.execute','mesh.supergpu.describe','mesh.supergpu.execute','mesh.supergpu.parallel','sara.health','sara.capabilities','sara.state','sara.cycle','sara.audit','sara.regenerate','sara.trace']; }
function localFusionSnapshot(){ const counts=topologyCounts(); return {system:'SOUL',fusionVersion:FUSION_VERSION,reference:SELF,protocol:PROTOCOL,contractVersion:CONTRACT_VERSION,nuclei:NUCLEUS_IDS.map(id=>({id,role:id===SELF?'host-reference-gateway':(peers.get(id)?.role||'independent-ai'),status:id===SELF?'online':(peers.get(id)?.status||'unknown'),endpoint:id===SELF?`http://${HOST}:${PORT}`:(peers.get(id)?.url||null),capabilities:id===SELF?capabilityList():(peers.get(id)?.capabilities||[]),channels:channelsFor(id)})),transports:TRANSPORTS,directionalChannels:counts.totalLogicalDirectedRoutes,endpointSurfaces:counts.totalEndpointSurfaces,topologyCounts:counts,ownership:'native-per-nucleus',fusion:'federated-independent-runtimes',superGPU:superGPU.describe(),byokInference:{provider:'google-gemini',configured:Boolean(process.env.GEMINI_API_KEY?.trim())},sara:saraDescribe(),federatedProviders:{SARA:{owner:'SARA',transport:'HTTP',configured:saraConfigured(),operations:saraDescribe().operations}}}; }
function resolveOwner(capability){ if(capability==='inference.intent') return 'N01'; if(capability?.startsWith('clareira.')) return 'N01'; for(const peer of peers.values()) if(Array.isArray(peer.capabilities)&&peer.capabilities.includes(capability)) return peer.id; if(capability?.startsWith('inference.')||capability?.startsWith('conversation.')) return 'N02'; if(capability?.startsWith('audio.')||capability?.startsWith('speech.')||capability?.startsWith('multimodal.')) return 'N03'; if(capability?.startsWith('document.')||capability?.startsWith('tool:')||capability?.startsWith('tool.')||capability?.startsWith('artifact.')) return 'N04'; if(capability?.startsWith('orchestration.')||capability?.startsWith('dispatch.')) return 'N05'; if(capability?.startsWith('pilot.')||capability?.startsWith('cognitive.')||capability?.startsWith('support.')) return 'N06'; return null; }
function resolveCapability(capability){ if(typeof capability!=='string'||!capability.trim()) throw new Error('CAPABILITY_REQUIRED'); if(capability.startsWith('sara.')) return {capability,owner:null,provider:'SARA',available:capability==='sara.health'?saraHealthConfigured():saraConfigured(),transport:'HTTP',nativeOwnership:false}; const owner=resolveOwner(capability); if(!owner) return {capability,owner:null,available:false,transport:null}; return {capability,owner,available:owner===SELF||Boolean(peers.get(owner)?.url),transport:owner===SELF?'IN_PROCESS':'REMOTE_MESH',nativeOwnership:true}; }
async function forward(target,message){ const peer=peers.get(target); if(!peer?.url) throw new Error(`PEER_NOT_DISCOVERED:${target}`); const until=circuitOpenUntil.get(target)||0; if(until>Date.now()) throw new Error(`PEER_CIRCUIT_OPEN:${target}`); const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),30_000); try{
  const wire={...message,meta:{...(message.meta||{})}};
  const headers={'content-type':'application/json','x-correlation-id':message.correlationId};
  if(SECRET){
    const nonce=crypto.randomUUID().replaceAll('-','').padEnd(32,'0').slice(0,32);
    wire.nonce=nonce;
    wire.meta={...wire.meta,nonce};
    headers['x-soul-mesh-nonce']=nonce;
    headers['x-soul-mesh-hmac']=protocolHmacFor(wire,nonce);
  }
  const response=await fetch(peer.url+'/api/soul-mesh',{method:'POST',headers,body:JSON.stringify(wire),signal:controller.signal,cache:'no-store'});
  const body=await response.json().catch(()=>({})); if(!response.ok) throw new Error(`PEER_HTTP_${response.status}`);
  failures.set(target,0); peer.lastSeen=Date.now(); peer.status='healthy'; return body;
 }catch(error){ const count=(failures.get(target)||0)+1; failures.set(target,count); if(count>=5) circuitOpenUntil.set(target,Date.now()+60_000); throw error; } finally{ clearTimeout(timer); } }
function bootstrapPeers(){ for(const id of PEER_IDS){ const endpoint=normalizeUrl(process.env[`SOUL_MESH_${id}_URL`]); if(endpoint) peers.set(id,{id,url:endpoint,capabilities:[],role:'independent-ai',lastSeen:Date.now(),status:'configured'}); } }
async function executeLocalCapability(task, correlationId) {
  if (task.capability === 'inference.intent') {
    return inferInitialIntent({ ...(task.payload || {}), correlationId });
  }
  throw new Error(`IN_PROCESS_EXECUTOR_UNAVAILABLE:${task.capability}`);
}
const superGPU=createSuperGPU({self:SELF,resolveOwner,forward,localExecute:executeLocalCapability});
async function executeUnified(capability,payload,correlationId){ if(capability==='inference.intent') return inferInitialIntent({...payload||{},correlationId}); if(capability.startsWith('sara.')) return (await requestSara(capability,payload,correlationId)).payload; const task={id:crypto.randomUUID(),capability,payload}; return superGPU.execute(task,correlationId); }
async function handle(req,res){ const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(req.method==='GET'&&url.pathname==='/mesh/health')return json(res,200,{ok:true,nucleus:SELF,protocol:PROTOCOL,contractVersion:CONTRACT_VERSION,timestamp:Date.now(),capabilities:capabilityList(),residentAgent:N01_RESIDENT_AGENT,peers:[...peers.values()].map(p=>({id:p.id,url:p.url,status:p.status,lastSeen:p.lastSeen})),byokInference:{provider:'google-gemini',configured:Boolean(process.env.GEMINI_API_KEY?.trim())}});
  if(req.method==='GET'&&url.pathname==='/mesh/discovery')return json(res,200,{nucleus:SELF,protocol:PROTOCOL,contractVersion:CONTRACT_VERSION,capabilities:capabilityList(),peers:[...peers.values()],transports:TRANSPORTS,channels:channelsFor(SELF)});
  if(req.method==='GET'&&(url.pathname==='/mesh/fusion'||url.pathname==='/api/soul-fusion'))return json(res,200,localFusionSnapshot());
  if(req.method==='POST'&&url.pathname==='/api/soul-intake'){ try{ const body=await readBody(req); const requestCorrelationId=typeof req.headers['x-correlation-id']==='string'&&req.headers['x-correlation-id'].trim()?req.headers['x-correlation-id'].trim():crypto.randomUUID(); const result=await inferInitialIntent({...body,correlationId:requestCorrelationId}); return json(res,200,{ok:true,nucleus:SELF,correlationId:requestCorrelationId,capability:'inference.intent',result}); }catch(error){ return json(res,502,{ok:false,nucleus:SELF,capability:'inference.intent',error:error instanceof Error?error.message:'GEMINI_INTENT_INFERENCE_ERROR'}); } }
  if(req.method==='POST'&&url.pathname==='/mesh/register'){ const body=await readBody(req); if(!PEER_IDS.includes(body.nucleus)||!normalizeUrl(body.endpoint))return json(res,400,{error:'INVALID_REGISTRATION'}); const id=body.nucleus; const token=crypto.randomUUID(); registrationTokens.set(id,token); peers.set(id,{id,url:normalizeUrl(body.endpoint),capabilities:Array.isArray(body.capabilities)?body.capabilities:[],role:typeof body.role==='string'?body.role:'independent-ai',lastSeen:Date.now(),status:'registered'}); return json(res,200,{ok:true,nucleus:SELF,registered:id,token,heartbeatIntervalMs:60_000,transports:TRANSPORTS,contractVersion:CONTRACT_VERSION}); }
  if(req.method==='POST'&&url.pathname==='/mesh/heartbeat'){ const body=await readBody(req); const id=body.nucleus; const expected=registrationTokens.get(id); const provided=(req.headers.authorization||'').replace(/^Bearer\s+/i,''); if(!PEER_IDS.includes(id)||!expected||provided!==expected)return json(res,401,{error:'INVALID_HEARTBEAT_AUTH'}); const peer=peers.get(id); if(!peer)return json(res,404,{error:'PEER_NOT_REGISTERED'}); peer.lastSeen=Date.now(); peer.status='healthy'; if(normalizeUrl(body.endpoint))peer.url=normalizeUrl(body.endpoint); if(Array.isArray(body.capabilities))peer.capabilities=body.capabilities; return json(res,200,{ok:true,nucleus:SELF,peer:id,contractVersion:CONTRACT_VERSION,timestamp:Date.now()}); }
  if(req.method==='POST'&&(url.pathname==='/mesh/in'||url.pathname==='/mesh/out'||url.pathname==='/api/soul-mesh')){ try{ const message=await readBody(req); if(message.protocol===PROTOCOL){ verifyProtocolEnvelope(message,req); if(message.target!==SELF)throw new Error('MESH_TARGET_MISMATCH'); if(!message.source||!/^N0[1-7]$/.test(message.source)||message.source===SELF||!message.correlationId)throw new Error('INVALID_SOUL_MESH_MESSAGE'); if(message.contractVersion!==CONTRACT_VERSION)throw new Error('UNSUPPORTED_MESH_CONTRACT_VERSION'); const capability=message.capability; const respond=(kind,payload,status=200)=>{ const body={protocol:PROTOCOL,contractVersion:CONTRACT_VERSION,id:crypto.randomUUID(),correlationId:message.correlationId,source:SELF,target:message.source,kind,capability,payload,timestamp:Date.now(),meta:{runtime:'aeternum-core-29',transport:'HTTP',encoding:'json',version:CONTRACT_VERSION,traceId:message.correlationId}}; const nonce=crypto.randomUUID().replaceAll('-','').padEnd(32,'0').slice(0,32); const signed=SECRET?protocolResponse({...body,nonce,meta:{...body.meta,nonce}},nonce):body; return json(res,status,signed); }; if(capability==='clareira.metrics')return respond('response',clareiraMetrics()); if(capability==='clareira.ingest'){const packet=message.payload?.packet;if(!isClareiraPacket(packet)){clareiraIngress.errored++;return respond('error',{code:'INVALID_CLAREIRA_PACKET'},400);}if(clareiraIngress.queue.length>=CLAREIRA_MAX_QUEUE_SIZE){clareiraIngress.dropped++;return respond('error',{code:'CLAREIRA_QUEUE_FULL',capacity:CLAREIRA_MAX_QUEUE_SIZE},429);}clareiraIngress.queue.push(packet);clareiraIngress.ingested++;return respond('response',{accepted:true,contractVersion:'1.0.0',correlationId:packet.correlationId,sourceId:packet.sourceId,queued:clareiraIngress.queue.length});} if(capability==='mesh.ping')return respond('response',{ok:true,nucleus:SELF}); if(capability==='mesh.resident.describe@1.0.0')return respond('response',N01_RESIDENT_AGENT); if(capability==='mesh.health')return respond('response',{ok:true,nucleus:SELF,peers:[...peers.keys()]}); if(capability==='mesh.discovery'||capability==='mesh.capabilities')return respond('response',{nucleus:SELF,capabilities:capabilityList(),peers:[...peers.values()],transports:TRANSPORTS,channels:channelsFor(SELF)}); if(capability==='mesh.fusion.describe')return respond('response',localFusionSnapshot()); if(capability==='mesh.capability.resolve'){ try{return respond('response',resolveCapability(message.payload?.capability));}catch(error){return respond('error',{code:error instanceof Error?error.message:'CAPABILITY_RESOLUTION_ERROR'},400);} } if(capability?.startsWith('sara.')){ try{return respond('response',await executeUnified(capability,message.payload,message.correlationId));}catch(error){return respond('error',{code:error instanceof Error?error.message:'SARA_REQUEST_FAILED',provider:'SARA'},502);} } if(capability==='inference.intent'){ try{return respond('response',await inferInitialIntent({...message.payload||{},correlationId:message.correlationId}));}catch(error){return respond('error',{code:error instanceof Error?error.message:'GEMINI_INTENT_INFERENCE_ERROR'},502);} } if(capability==='mesh.supergpu.describe')return respond('response',superGPU.describe()); if(capability==='mesh.supergpu.execute'){ try{const task=message.payload?.task;if(!task)return respond('error',{code:'SUPERGPU_TASK_REQUIRED'},400);return respond('response',await superGPU.execute(task,message.correlationId));}catch(error){return respond('error',{code:'SUPERGPU_EXECUTION_ERROR',detail:error instanceof Error?error.message:'Unknown error'},502);} } if(capability==='mesh.supergpu.parallel'){ try{const tasks=message.payload?.tasks;if(!Array.isArray(tasks))return respond('error',{code:'SUPERGPU_TASKS_REQUIRED'},400);return respond('response',await superGPU.executeParallel(tasks,message.correlationId));}catch(error){return respond('error',{code:'SUPERGPU_PARALLEL_EXECUTION_ERROR',detail:error instanceof Error?error.message:'Unknown error'},502);} } if(capability==='mesh.fusion.execute'){ try{const requested=message.payload?.capability;if(typeof requested!=='string')return respond('error',{code:'CAPABILITY_REQUIRED'},400);if(requested==='inference.intent')return respond('response',await inferInitialIntent({...message.payload?.payload||{},correlationId:message.correlationId}));return respond('response',await executeUnified(requested,message.payload?.payload,message.correlationId));}catch(error){return respond('error',{code:'CAPABILITY_EXECUTION_ERROR',detail:error instanceof Error?error.message:'Unknown error'},502);} } if(capability==='mesh.register')return respond('response',{ok:true,registry:[...peers.keys()]}); if(capability==='mesh.heartbeat')return respond('response',{ok:true,timestamp:Date.now()}); if(capability==='mesh.delegate'){ const target=message.payload?.target;if(!PEER_IDS.includes(target)||target===SELF)return respond('error',{code:'INVALID_DELEGATION_TARGET'},400); const delegatedPayload=await buildCognitiveDelegationPayload(message.payload?.payload||{},message.correlationId); return json(res,200,await forward(target,canonicalMessage(target,message.payload?.capability||'mesh.ping',delegatedPayload,message.correlationId))); } const owner=resolveOwner(capability); if(owner&&owner!==SELF)return json(res,200,await forward(owner,message)); return respond('error',{code:'CAPABILITY_NOT_IMPLEMENTED',capability},501); }
 verifyEnvelope(message); const capability=message.payload?.capability; if(capability==='mesh.ping'||message.type==='PING')return json(res,200,envelope({target:message.source,correlationId:message.correlationId,payload:{ok:true,nucleus:SELF}})); if(capability==='mesh.health')return json(res,200,envelope({target:message.source,correlationId:message.correlationId,payload:{ok:true,nucleus:SELF,peers:[...peers.keys()]}})); if(capability==='mesh.discovery'||capability==='mesh.capabilities'||capability==='mesh.fusion.describe')return json(res,200,envelope({target:message.source,correlationId:message.correlationId,payload:localFusionSnapshot()})); if(capability==='mesh.capability.resolve'){ const requested=message.payload?.capability;if(typeof requested!=='string')return json(res,400,envelope({target:message.source,correlationId:message.correlationId,type:'ERROR',payload:{code:'CAPABILITY_REQUIRED'}}));return json(res,200,envelope({target:message.source,correlationId:message.correlationId,payload:resolveCapability(requested)})); } if(capability==='mesh.fusion.execute'||capability==='mesh.supergpu.execute'){ const requested=capability==='mesh.supergpu.execute'?message.payload?.task?.capability:message.payload?.capability;if(typeof requested!=='string')return json(res,400,envelope({target:message.source,correlationId:message.correlationId,type:'ERROR',payload:{code:'CAPABILITY_REQUIRED'}}));try{return json(res,200,await superGPU.execute({id:message.payload?.task?.id||crypto.randomUUID(),capability:requested,payload:message.payload?.task?.payload??message.payload?.payload},message.correlationId));}catch(error){return json(res,502,envelope({target:message.source,correlationId:message.correlationId,type:'ERROR',payload:{code:'SUPERGPU_EXECUTION_ERROR',detail:error instanceof Error?'error':error.message}}));} } if(capability?.startsWith('sara.')){ try{const saraPayload=message.payload&&typeof message.payload==='object'&&'payload' in message.payload?message.payload.payload:message.payload;return json(res,200,envelope({target:message.source,correlationId:message.correlationId,payload:await executeUnified(capability,saraPayload,message.correlationId)}));}catch(error){return json(res,502,envelope({target:message.source,correlationId:message.correlationId,type:'ERROR',payload:{code:error instanceof Error?error.message:'SARA_REQUEST_FAILED',provider:'SARA'}}));} } if(capability==='inference.intent'){ try{return json(res,200,envelope({target:message.source,correlationId:message.correlationId,payload:await inferInitialIntent({...message.payload||{},correlationId:message.correlationId})}));}catch(error){return json(res,502,envelope({target:message.source,correlationId:message.correlationId,type:'ERROR',payload:{code:error instanceof Error?error.message:'GEMINI_INTENT_INFERENCE_ERROR'}}));} } const owner=resolveOwner(capability); if(owner&&owner!==SELF)return json(res,200,await forward(owner,message)); return json(res,501,envelope({target:message.source,correlationId:message.correlationId,type:'ERROR',payload:{code:'CAPABILITY_NOT_IMPLEMENTED',capability}})); }
 catch(error){return json(res,400,{ok:false,error:error instanceof Error?error.message:'MESH_ERROR'});} }
}

bootstrapPeers();
const server=http.createServer((req,res)=>handle(req,res).catch(error=>json(res,500,{ok:false,error:error instanceof Error?error.message:'INTERNAL_ERROR'})));
server.listen(PORT,HOST,()=>console.log(`SOUL N01 Mesh/Fusion ${FUSION_VERSION} listening on ${HOST}:${PORT}`));
process.on('SIGTERM',()=>server.close()); process.on('SIGINT',()=>server.close());
