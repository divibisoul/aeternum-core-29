export type NucleusId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06';
export type MeshKind = 'request' | 'response' | 'event' | 'error';
export type SoulMeshMessage = {
  protocol: 'soul-mesh/1'; id: string; correlationId: string;
  source: NucleusId; target: NucleusId; kind: MeshKind;
  capability: string; payload: unknown; timestamp: number;
};

const PEERS: Exclude<NucleusId, 'N01'>[] = ['N02','N03','N04','N05','N06'];
const env = (import.meta as ImportMeta & { env?: Record<string,string> }).env ?? {};
const urls: Partial<Record<NucleusId,string>> = {
  N02: env.VITE_SOUL_MESH_N02_URL, N03: env.VITE_SOUL_MESH_N03_URL,
  N04: env.VITE_SOUL_MESH_N04_URL, N05: env.VITE_SOUL_MESH_N05_URL,
  N06: env.VITE_SOUL_MESH_N06_URL,
};

function uuid() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`; }

export async function sendTo(target: NucleusId, capability: string, payload: unknown, timeoutMs = 15000): Promise<SoulMeshMessage> {
  if (target === 'N01') throw new Error('N01 inbound transport is owned by the Android runtime bridge');
  const url = urls[target];
  if (!url) throw new Error(`SOUL_MESH_PEER_URL_NOT_CONFIGURED:${target}`);
  const correlationId = uuid();
  const message: SoulMeshMessage = { protocol:'soul-mesh/1', id:uuid(), correlationId, source:'N01', target, kind:'request', capability, payload, timestamp:Date.now() };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(message), signal:controller.signal });
    const body = await response.json() as SoulMeshMessage;
    if (body.correlationId !== correlationId) throw new Error('SOUL_MESH_CORRELATION_MISMATCH');
    if (!response.ok || body.kind === 'error') throw new Error(`SOUL_MESH_REMOTE_ERROR:${target}:${body.payload && typeof body.payload === 'object' && 'code' in body.payload ? String((body.payload as {code:string}).code) : response.status}`);
    return body;
  } finally { clearTimeout(timer); }
}

export async function pingAll(timeoutMs = 5000) {
  return Promise.all(PEERS.map(async target => {
    try { const response = await sendTo(target,'mesh.ping',{from:'N01',channel:`N01.OUT.${target}`},timeoutMs); return {target,status:'CONNECTED' as const,response}; }
    catch (error) { return {target,status:'FAILED' as const,error:String(error)}; }
  }));
}

export const N01_OUT_CHANNELS = PEERS.map(target => `N01.OUT.${target}`);
export const N01_IN_CHANNELS = PEERS.map(source => `N01.IN.${source}`);
export const N01_LOGICAL_CHANNELS = [...N01_OUT_CHANNELS, ...N01_IN_CHANNELS];
