export type NucleusId='N01'|'N02'|'N03'|'N04'|'N05'|'N06'|'N07';
export type MeshKind='request'|'response'|'event'|'error';
export type SoulMeshMessage={protocol:'soul-mesh/1';contractVersion:'1.1.0';id:string;correlationId:string;source:NucleusId;target:NucleusId;kind:MeshKind;capability:string;payload:unknown;timestamp:number;meta?:{runtime?:string;transport?:string;encoding?:string;version?:string;nonce?:string;traceId?:string}};

const ACTIVE_PEERS:Exclude<NucleusId,'N01'|'N07'>[]=['N02','N03','N04','N05','N06'];
const N07_STRUCTURAL_CAPABILITIES = new Set(['mesh.ping', 'external.federation.describe@1.0.0', 'external.federation.execute@1.0.0']);
const MAX_ATTEMPTS=3;
const RETRY_BASE_DELAY_MS=250;
const CIRCUIT_FAILURE_THRESHOLD=3;
const CIRCUIT_COOLDOWN_MS=10_000;
const circuitFailures=new Map<NucleusId,number>();
const circuitOpenedAt=new Map<NucleusId,number>();

type SessionAccessTokenProvider = () => Promise<string | null>;
let sessionAccessTokenProvider: SessionAccessTokenProvider | null = null;

/**
 * Allows the application shell to provide its existing Supabase session resolver.
 * The default path reads the authenticated user's current session; it never reads
 * a VITE_* mesh secret or treats a browser-supplied nucleus identity as authority.
 */
export function setSoulMeshSessionAccessTokenProvider(provider: SessionAccessTokenProvider | null) {
  sessionAccessTokenProvider = provider;
}

async function getSessionAccessToken(): Promise<string> {
  let token: string | null | undefined;
  if (sessionAccessTokenProvider) {
    token = await sessionAccessTokenProvider();
  } else {
    if (typeof window === 'undefined') throw new Error('SOUL_MESH_BROWSER_SESSION_REQUIRED');
    const { supabase } = await import('../../integrations/supabase/client');
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error('SOUL_MESH_BROWSER_SESSION_UNAVAILABLE');
    token = data.session?.access_token;
  }
  if (typeof token !== 'string' || token.trim().length < 20) {
    throw new Error('SOUL_MESH_BROWSER_SESSION_REQUIRED');
  }
  return token.trim();
}

function uuid() {
  const crypto = globalThis.crypto;
  if (crypto?.randomUUID) return crypto.randomUUID();
  if (!crypto?.getRandomValues) throw new Error('SOUL_MESH_SECURE_RANDOM_UNAVAILABLE');
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

function jitter(maxMs: number) {
  if (maxMs <= 0) return 0;
  const crypto = globalThis.crypto;
  if (!crypto?.getRandomValues) throw new Error('SOUL_MESH_SECURE_RANDOM_UNAVAILABLE');
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0] % maxMs;
}
function sleep(ms: number) { return new Promise<void>(resolve => setTimeout(resolve, ms)); }
function isRetryableStatus(status: number) { return status === 408 || status === 425 || status === 429 || status >= 500; }
function circuitAllows(target: NucleusId) {
  const openedAt = circuitOpenedAt.get(target);
  if (openedAt === undefined) return true;
  if (Date.now() - openedAt >= CIRCUIT_COOLDOWN_MS) {
    circuitOpenedAt.delete(target);
    circuitFailures.delete(target);
    return true;
  }
  return false;
}
function recordSuccess(target: NucleusId) { circuitFailures.delete(target); circuitOpenedAt.delete(target); }
function recordFailure(target: NucleusId) {
  const failures = (circuitFailures.get(target) ?? 0) + 1;
  circuitFailures.set(target, failures);
  if (failures >= CIRCUIT_FAILURE_THRESHOLD) circuitOpenedAt.set(target, Date.now());
}
function retryableTransportError(error: unknown) {
  return (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError')
    || error instanceof TypeError;
}
function assertResponse(request: { target: NucleusId; capability: string; correlationId: string }, response: unknown): asserts response is SoulMeshMessage {
  if (!response || typeof response !== 'object') throw new Error('SOUL_MESH_INVALID_RESPONSE');
  const candidate = response as SoulMeshMessage;
  if (candidate.protocol !== 'soul-mesh/1') throw new Error('SOUL_MESH_PROTOCOL_MISMATCH');
  if (candidate.contractVersion !== '1.1.0') throw new Error('SOUL_MESH_CONTRACT_MISMATCH');
  if (candidate.correlationId !== request.correlationId) throw new Error('SOUL_MESH_CORRELATION_MISMATCH');
  if (candidate.source !== request.target || candidate.target !== 'N01') throw new Error('SOUL_MESH_ROUTE_MISMATCH');
  if (candidate.capability !== request.capability) throw new Error('SOUL_MESH_CAPABILITY_MISMATCH');
  if (candidate.kind !== 'response' && candidate.kind !== 'error') throw new Error('SOUL_MESH_INVALID_RESPONSE_KIND');
  if (typeof candidate.id !== 'string' || !candidate.id || !Number.isFinite(candidate.timestamp)) throw new Error('SOUL_MESH_INVALID_RESPONSE_ENVELOPE');
  if (Math.abs(Date.now() - candidate.timestamp) > 30_000) throw new Error('SOUL_MESH_RESPONSE_TIMESTAMP_OUT_OF_RANGE');
}
const RETRY_SAFE_CAPABILITIES = new Set([
  'mesh.ping', 'mesh.health', 'mesh.discovery', 'mesh.capabilities', 'mesh.describe', 'core.health',
  'sara.health', 'sara.state', 'sara.capabilities', 'sara.trace',
]);

async function dispatchWithRetry(target: NucleusId, capability: string, payload: unknown, correlationId: string, timeoutMs: number): Promise<SoulMeshMessage> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('SOUL_MESH_INVALID_TIMEOUT');
  if (target === 'N01') throw new Error('N01 inbound transport is owned by the Android runtime bridge');
  if (!ACTIVE_PEERS.includes(target as Exclude<NucleusId, 'N01' | 'N07'>) && target !== 'N07') {
    throw new Error(`SOUL_MESH_PEER_NOT_ALLOWED:${target}`);
  }
  if (!capability.trim() || !/^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,255}$/.test(capability.trim())) {
    throw new Error('SOUL_MESH_CAPABILITY_REQUIRED');
  }
  if (target === 'N07' && !N07_STRUCTURAL_CAPABILITIES.has(capability.trim())) {
    throw new Error('N07_STRUCTURAL_CAPABILITY_ONLY');
  }
  const origin = globalThis.location?.origin?.trim() ?? '';
  if (!origin) throw new Error('SOUL_MESH_BROWSER_ORIGIN_REQUIRED');
  const requestUrl = new URL('/api/soul-mesh/relay', origin).toString();
  if (!circuitAllows(target)) throw new Error(`SOUL_MESH_CIRCUIT_OPEN:${target}`);

  const retrySafe = RETRY_SAFE_CAPABILITIES.has(capability.trim());
  const attempts = retrySafe ? MAX_ATTEMPTS : 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const sessionToken = await getSessionAccessToken();
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${sessionToken}`,
          'x-soul-correlation-id': correlationId,
        },
        body: JSON.stringify({ target, capability: capability.trim(), payload, correlationId }),
        signal: controller.signal,
        cache: 'no-store',
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const error = new Error(`SOUL_MESH_RELAY_HTTP_${response.status}`);
        if (attempt < attempts && isRetryableStatus(response.status)) {
          lastError = error;
          await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1) + jitter(100));
          continue;
        }
        throw error;
      }

      assertResponse({ target, capability: capability.trim(), correlationId }, body);
      if (body.kind === 'error') {
        const code = body.payload && typeof body.payload === 'object' && 'code' in body.payload
          ? String((body.payload as { code: unknown }).code)
          : 'REMOTE_ERROR';
        throw new Error(`SOUL_MESH_REMOTE_ERROR:${target}:${code}`);
      }
      recordSuccess(target);
      return body;
    } catch (error) {
      lastError = error;
      if (attempt < attempts && retryableTransportError(error)) {
        await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1) + jitter(100));
        continue;
      }
      recordFailure(target);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  recordFailure(target);
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function sendTo(target: NucleusId, capability: string, payload: unknown, timeoutMs = 15_000, correlationId = uuid()): Promise<SoulMeshMessage> {
  const resolvedCorrelation = correlationId.trim();
  if (!/^[A-Za-z0-9._:/-]{1,128}$/.test(resolvedCorrelation)) throw new Error('SOUL_MESH_CORRELATION_INVALID');
  return dispatchWithRetry(target, capability, payload, resolvedCorrelation, timeoutMs);
}

export async function pingAll(timeoutMs = 5000) {
  return Promise.all(ACTIVE_PEERS.map(async target => {
    try {
      const response = await sendTo(target, 'mesh.ping', { from: 'N01', channel: `N01.OUT.${target}` }, timeoutMs);
      return { target, status: 'CONNECTED' as const, response };
    } catch (error) {
      return { target, status: 'FAILED' as const, error: String(error) };
    }
  }));
}
export async function pingStructuralControlPlane(timeoutMs = 5000) {
  try {
    const response = await sendTo('N07', 'mesh.ping', { from: 'N01', scope: 'STRUCTURAL_CONTROL_PLANE', channel: 'N01.OUT.N07' }, timeoutMs);
    return { target: 'N07', scope: 'STRUCTURAL_CONTROL_PLANE' as const, status: 'CONNECTED' as const, response };
  } catch (error) {
    return { target: 'N07', scope: 'STRUCTURAL_CONTROL_PLANE' as const, status: 'FAILED' as const, error: String(error) };
  }
}
export const N01_OUT_CHANNELS = ACTIVE_PEERS.map(target => `N01.OUT.${target}`);
export const N01_IN_CHANNELS = ACTIVE_PEERS.map(source => `N01.IN.${source}`);
export const N01_LOGICAL_CHANNELS = [...N01_OUT_CHANNELS, ...N01_IN_CHANNELS];
export const N01_STRUCTURAL_OUT_CHANNELS = ['N07.OUT.N01'];
export const N01_STRUCTURAL_IN_CHANNELS = ['N01.IN.N07'];
