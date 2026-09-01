export type NucleusId='N01'|'N02'|'N03'|'N04'|'N05'|'N06'|'N07';
export type MeshKind='request'|'response'|'event'|'error';
export type SoulMeshMessage={protocol:'soul-mesh/1';contractVersion:'1.1.0';id:string;correlationId:string;source:NucleusId;target:NucleusId;kind:MeshKind;capability:string;payload:unknown;timestamp:number;meta?:{runtime?:string;transport?:string;encoding?:string;version?:string;nonce?:string;traceId?:string}};

/** N07 remains a structural boundary until the final N01×N06×N07 commissioning stage. */
const ACTIVE_PEERS:Exclude<NucleusId,'N01'|'N07'>[]=['N02','N03','N04','N05','N06'];
const STRUCTURAL_PEERS:Exclude<NucleusId,'N01'>[]=['N02','N03','N04','N05','N06','N07'];
const MAX_ATTEMPTS=3;
const RETRY_BASE_DELAY_MS=250;
const CIRCUIT_FAILURE_THRESHOLD=3;
const CIRCUIT_COOLDOWN_MS=10_000;
const circuitFailures=new Map<NucleusId,number>();
const circuitOpenedAt=new Map<NucleusId,number>();

const env=(import.meta as ImportMeta & {env?:Record<string,string>}).env??{};
const urls:Partial<Record<NucleusId,string>>={N02:env.VITE_SOUL_MESH_N02_URL,N03:env.VITE_SOUL_MESH_N03_URL,N04:env.VITE_SOUL_MESH_N04_URL,N05:env.VITE_SOUL_MESH_N05_URL,N06:env.VITE_SOUL_MESH_N06_URL,N07:env.VITE_SOUL_MESH_N07_URL};
const token=env.VITE_SOUL_MESH_TOKEN?.trim()??'';
function uuid(){return globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2,12)}`;}
function nonce(){return uuid().replaceAll('-','').padEnd(32,'0').slice(0,32);}
function sleep(ms:number){return new Promise<void>(resolve=>setTimeout(resolve,ms));}
function isRetryableStatus(status:number){return status===408||status===429||status>=500;}
function circuitAllows(target:NucleusId){const openedAt=circuitOpenedAt.get(target);if(openedAt===undefined)return true;if(Date.now()-openedAt>=CIRCUIT_COOLDOWN_MS){circuitOpenedAt.delete(target);circuitFailures.delete(target);return true;}return false;}
function recordSuccess(target:NucleusId){circuitFailures.delete(target);circuitOpenedAt.delete(target);}
function recordFailure(target:NucleusId){const failures=(circuitFailures.get(target)??0)+1;circuitFailures.set(target,failures);if(failures>=CIRCUIT_FAILURE_THRESHOLD)circuitOpenedAt.set(target,Date.now());}

export async function sendTo(target:NucleusId,capability:string,payload:unknown,timeoutMs=15000):Promise<SoulMeshMessage>{
 if(target==='N01')throw new Error('N01 inbound transport is owned by the Android runtime bridge');
 if(target==='N07')throw new Error('N07_NOT_COMMISSIONED');
 const url=urls[target];if(!url)throw new Error(`SOUL_MESH_PEER_URL_NOT_CONFIGURED:${target}`);if(!capability.trim())throw new Error('SOUL_MESH_CAPABILITY_REQUIRED');
 if(!circuitAllows(target))throw new Error(`SOUL_MESH_CIRCUIT_OPEN:${target}`);
 const correlationId=uuid();let lastError:unknown;
 for(let attempt=1;attempt<=MAX_ATTEMPTS;attempt++){
  const id=uuid();const n=nonce();
  const message:SoulMeshMessage={protocol:'soul-mesh/1',contractVersion:'1.1.0',id,correlationId,source:'N01',target,kind:'request',capability,payload,timestamp:Date.now(),meta:{runtime:'aeternum-core-29',transport:'HTTP',encoding:'json',version:'1.1.0',traceId:correlationId,nonce:n}};
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const headers:Record<string,string>={'content-type':'application/json','x-soul-correlation-id':correlationId,'x-soul-mesh-nonce':n};
   if(token)headers.authorization=`Bearer ${token}`;
   const response=await fetch(`${url.replace(/\/$/,'')}/api/soul-mesh`,{method:'POST',headers,body:JSON.stringify(message),signal:controller.signal});
   const body=await response.json() as SoulMeshMessage;
   if(body.correlationId!==correlationId)throw new Error('SOUL_MESH_CORRELATION_MISMATCH');
   if(body.contractVersion!=='1.1.0'||body.protocol!=='soul-mesh/1')throw new Error('SOUL_MESH_CONTRACT_MISMATCH');
   if(body.source!==target||body.target!=='N01')throw new Error('SOUL_MESH_ROUTE_MISMATCH');
   if(!response.ok||body.kind==='error'){
    const detail=`SOUL_MESH_REMOTE_ERROR:${target}:${body.payload&&typeof body.payload==='object'&&'code'in body.payload?String((body.payload as {code:string}).code):response.status}`;
    if(!isRetryableStatus(response.status))throw new Error(detail);throw new Error(detail);
   }
   recordSuccess(target);return body;
  }catch(error){lastError=error;const text=error instanceof Error?error.message:String(error);const retryable=(error instanceof DOMException&&error.name==='AbortError')||text.includes('fetch failed')||text.includes('network')||text.startsWith('SOUL_MESH_REMOTE_ERROR:');if(!retryable||attempt===MAX_ATTEMPTS){recordFailure(target);throw error;}await sleep(RETRY_BASE_DELAY_MS*2**(attempt-1)+Math.floor(Math.random()*100));}
  finally{clearTimeout(timer);}
 }
 recordFailure(target);throw lastError instanceof Error?lastError:new Error(String(lastError));
}

export async function pingAll(timeoutMs=5000){return Promise.all(ACTIVE_PEERS.map(async target=>{try{const response=await sendTo(target,'mesh.ping',{from:'N01',channel:`N01.OUT.${target}`},timeoutMs);return{target,status:'CONNECTED' as const,response};}catch(error){return{target,status:'FAILED' as const,error:String(error)};}}))}
export const N01_OUT_CHANNELS=ACTIVE_PEERS.map(target=>`N01.OUT.${target}`);
export const N01_IN_CHANNELS=ACTIVE_PEERS.map(source=>`N01.IN.${source}`);
export const N01_LOGICAL_CHANNELS=[...N01_OUT_CHANNELS,...N01_IN_CHANNELS];
export const N01_STRUCTURAL_OUT_CHANNELS=STRUCTURAL_PEERS.map(target=>`N01.OUT.${target}`);
export const N01_STRUCTURAL_IN_CHANNELS=STRUCTURAL_PEERS.map(source=>`N01.IN.${source}`);
