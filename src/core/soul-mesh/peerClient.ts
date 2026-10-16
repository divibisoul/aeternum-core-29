export type NucleusId='N01'|'N02'|'N03'|'N04'|'N05'|'N06'|'N07';
export type MeshKind='request'|'response'|'event'|'error';
export type SoulMeshMessage={protocol:'soul-mesh/1';contractVersion:'1.1.0';id:string;correlationId:string;source:NucleusId;target:NucleusId;kind:MeshKind;capability:string;payload:unknown;timestamp:number;meta?:{runtime?:string;transport?:string;encoding?:string;version?:string;nonce?:string;traceId?:string}};

/** N02–N06 are operational AI peers; N07 remains structural/control-plane only. */
const ACTIVE_PEERS:Exclude<NucleusId,'N01'|'N07'>[]=['N02','N03','N04','N05','N06'];
const STRUCTURAL_PEERS:Extract<NucleusId,'N07'>[]=['N07'];
const N07_STRUCTURAL_CAPABILITIES = new Set(['mesh.ping', 'external.federation.describe@1.0.0', 'external.federation.execute@1.0.0']);
const MAX_ATTEMPTS=3;
const RETRY_BASE_DELAY_MS=250;
const CIRCUIT_FAILURE_THRESHOLD=3;
const CIRCUIT_COOLDOWN_MS=10_000;
const circuitFailures=new Map<NucleusId,number>();
const circuitOpenedAt=new Map<NucleusId,number>();

const env=(import.meta as ImportMeta & {env?:Record<string,string>}).env??{};
const urls:Partial<Record<NucleusId,string>>={N02:env.VITE_SOUL_MESH_N02_URL,N03:env.VITE_SOUL_MESH_N03_URL,N04:env.VITE_SOUL_MESH_N04_URL,N05:env.VITE_SOUL_MESH_N05_URL,N06:env.VITE_SOUL_MESH_N06_URL,N07:env.VITE_SOUL_MESH_N07_URL};
const token=env.VITE_SOUL_MESH_TOKEN?.trim()??'';
function uuid(){
 const crypto=globalThis.crypto;
 if(crypto?.randomUUID)return crypto.randomUUID();
 if(!crypto?.getRandomValues)throw new Error('SOUL_MESH_SECURE_RANDOM_UNAVAILABLE');
 const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);
 bytes[6]=(bytes[6]&0x0f)|0x40;bytes[8]=(bytes[8]&0x3f)|0x80;
 const hex=Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('');
 return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
function jitter(maxMs:number){
 if(maxMs<=0)return 0;
 const crypto=globalThis.crypto;
 if(!crypto?.getRandomValues)throw new Error('SOUL_MESH_SECURE_RANDOM_UNAVAILABLE');
 const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);
 return bytes[0]%maxMs;
}
function nonce(){return uuid().replaceAll('-','').padEnd(32,'0').slice(0,32);}
function sleep(ms:number){return new Promise<void>(resolve=>setTimeout(resolve,ms));}
function isRetryableStatus(status:number){return status===408||status===429||status>=500;}
function circuitAllows(target:NucleusId){const openedAt=circuitOpenedAt.get(target);if(openedAt===undefined)return true;if(Date.now()-openedAt>=CIRCUIT_COOLDOWN_MS){circuitOpenedAt.delete(target);circuitFailures.delete(target);return true;}return false;}
function recordSuccess(target:NucleusId){circuitFailures.delete(target);circuitOpenedAt.delete(target);}
function recordFailure(target:NucleusId){const failures=(circuitFailures.get(target)??0)+1;circuitFailures.set(target,failures);if(failures>=CIRCUIT_FAILURE_THRESHOLD)circuitOpenedAt.set(target,Date.now());}

export async function sendTo(target:NucleusId,capability:string,payload:unknown,timeoutMs=15000,correlationId=uuid()):Promise<SoulMeshMessage>{
 if(target==='N01')throw new Error('N01 inbound transport is owned by the Android runtime bridge');
 const directUrl=urls[target];
 const isN07=target==='N07';
 if(isN07&&!N07_STRUCTURAL_CAPABILITIES.has(capability.trim()))throw new Error('N07_STRUCTURAL_CAPABILITY_ONLY');
 const relayOrigin=globalThis.location?.origin?.trim()??'';
 const requestUrl=isN07?`${relayOrigin}/api/soul-mesh/n07`:`${(directUrl??'').replace(/\/$/,'')}/api/soul-mesh`;
 if(isN07&&!relayOrigin)throw new Error('N07_BROWSER_RELAY_ORIGIN_REQUIRED');
 if(!directUrl&&!isN07)throw new Error(`SOUL_MESH_PEER_URL_NOT_CONFIGURED:${target}`);if(!capability.trim())throw new Error('SOUL_MESH_CAPABILITY_REQUIRED');
 if(!circuitAllows(target))throw new Error(`SOUL_MESH_CIRCUIT_OPEN:${target}`);
 const messageId=uuid();
 const baseMessage:Omit<SoulMeshMessage,'id'|'timestamp'|'meta'>={protocol:'soul-mesh/1',contractVersion:'1.1.0',correlationId,source:'N01',target,kind:'request',capability,payload};
 let lastError:unknown;
 for(let attempt=1;attempt<=MAX_ATTEMPTS;attempt++){
  const id=messageId;const n=nonce();
  const message:SoulMeshMessage={...baseMessage,id,timestamp:Date.now(),meta:{runtime:'aeternum-core-29',transport:'HTTP',encoding:'json',version:'1.1.0',traceId:correlationId,nonce:n}};
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const headers:Record<string,string>={'content-type':'application/json','x-soul-correlation-id':correlationId};
   if(!isN07)headers['x-soul-mesh-nonce']=n;
   if(token&&!isN07)headers.authorization=`Bearer ${token}`;
   const response=await fetch(requestUrl,{method:'POST',headers,body:JSON.stringify(message),signal:controller.signal,cache:'no-store'});
   const body=await response.json() as SoulMeshMessage;
   if(body.correlationId!==correlationId)throw new Error('SOUL_MESH_CORRELATION_MISMATCH');
   if(body.contractVersion!=='1.1.0'||body.protocol!=='soul-mesh/1')throw new Error('SOUL_MESH_CONTRACT_MISMATCH');
   if(body.source!==target||body.target!=='N01')throw new Error('SOUL_MESH_ROUTE_MISMATCH');
   if(!response.ok||body.kind==='error'){
    const detail=`SOUL_MESH_REMOTE_ERROR:${target}:${body.payload&&typeof body.payload==='object'&&'code'in body.payload?String((body.payload as {code:string}).code):response.status}`;
    if(!isRetryableStatus(response.status))throw new Error(detail);throw new Error(detail);
   }
   recordSuccess(target);return body;
  }catch(error){lastError=error;const text=error instanceof Error?error.message:String(error);const retryable=(error instanceof DOMException&&error.name==='AbortError')||text.includes('fetch failed')||text.includes('network')||text.startsWith('SOUL_MESH_REMOTE_ERROR:');if(!retryable||attempt===MAX_ATTEMPTS){recordFailure(target);throw error;}await sleep(RETRY_BASE_DELAY_MS*2**(attempt-1)+jitter(100));}
  finally{clearTimeout(timer);}
 }
 recordFailure(target);throw lastError instanceof Error?lastError:new Error(String(lastError));
}

export async function pingAll(timeoutMs=5000){return Promise.all(ACTIVE_PEERS.map(async target=>{try{const response=await sendTo(target,'mesh.ping',{from:'N01',channel:`N01.OUT.${target}`},timeoutMs);return{target,status:'CONNECTED' as const,response};}catch(error){return{target,status:'FAILED' as const,error:String(error)};}}))}
export async function pingStructuralControlPlane(timeoutMs=5000){try{const response=await sendTo('N07','mesh.ping',{from:'N01',scope:'STRUCTURAL_CONTROL_PLANE',channel:'N01.OUT.N07'},timeoutMs);return{target:'N07',scope:'STRUCTURAL_CONTROL_PLANE' as const,status:'CONNECTED' as const,response};}catch(error){return{target:'N07',scope:'STRUCTURAL_CONTROL_PLANE' as const,status:'FAILED' as const,error:String(error)};}}
export const N01_OUT_CHANNELS=ACTIVE_PEERS.map(target=>`N01.OUT.${target}`);
export const N01_IN_CHANNELS=ACTIVE_PEERS.map(source=>`N01.IN.${source}`);
export const N01_LOGICAL_CHANNELS=[...N01_OUT_CHANNELS,...N01_IN_CHANNELS];
export const N01_STRUCTURAL_OUT_CHANNELS=STRUCTURAL_PEERS.map(target=>`N01.OUT.${target}`);
export const N01_STRUCTURAL_IN_CHANNELS=STRUCTURAL_PEERS.map(source=>`N01.IN.${source}`);
