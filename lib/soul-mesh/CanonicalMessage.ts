import {
  SOUL_MESH_PROTOCOL,
  SOUL_MESH_CONTRACT_VERSION,
  SOUL_NUCLEI,
  type SoulMeshMessage,
} from '@/src/core/mesh/SoulMeshProtocol';

export type CanonicalMessage<T = unknown> = SoulMeshMessage<T>;
export const CANONICAL_PROTOCOL = SOUL_MESH_PROTOCOL;
export const CANONICAL_CONTRACT_VERSION = SOUL_MESH_CONTRACT_VERSION;
const encoder = new TextEncoder();
const MAX_CLOCK_SKEW_MS = 30_000;

export interface MessageSecurityOptions {
  nowMs?: number;
  maxClockSkewMs?: number;
  seenNonces?: Set<string>;
}

function canonicalUnsigned(message: CanonicalMessage): string {
  return JSON.stringify({
    protocol: message.protocol,
    contractVersion: message.contractVersion,
    id: message.id,
    correlationId: message.correlationId,
    source: message.source,
    target: message.target,
    kind: message.kind,
    capability: message.capability ?? null,
    payload: message.payload,
    timestamp: message.timestamp,
    transport: message.transport ?? null,
    meta: message.meta ?? null,
  });
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new Error('INVALID_HMAC_SHA256');
  const bytes = new Uint8Array(32);
  for (let index = 0; index < 32; index += 1) bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  return bytes;
}

async function importKey(secret: Uint8Array): Promise<CryptoKey> {
  if (secret.byteLength < 16) throw new Error('HMAC_SECRET_TOO_SHORT');
  return crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export function validateCanonicalMessage(value: unknown, options: MessageSecurityOptions = {}): value is CanonicalMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Record<string, unknown>;
  if (message.protocol !== CANONICAL_PROTOCOL || message.contractVersion !== CANONICAL_CONTRACT_VERSION) return false;
  if (typeof message.id !== 'string' || !message.id || message.id.length > 200) return false;
  if (typeof message.correlationId !== 'string' || !message.correlationId || message.correlationId.length > 200) return false;
  if (!(SOUL_NUCLEI as readonly string[]).includes(message.source as string) || !(SOUL_NUCLEI as readonly string[]).includes(message.target as string)) return false;
  if (message.source === message.target) return false;
  if (!['request', 'response', 'event', 'error'].includes(message.kind as string)) return false;
  if ((message.kind === 'request' || message.kind === 'response' || message.kind === 'error') && (typeof message.capability !== 'string' || !message.capability.trim())) return false;
  if (typeof message.timestamp !== 'number' || !Number.isFinite(message.timestamp)) return false;
  const nowMs = options.nowMs ?? Date.now();
  if (Math.abs(nowMs - message.timestamp) > (options.maxClockSkewMs ?? MAX_CLOCK_SKEW_MS)) return false;
  const nonce = typeof (message.meta as Record<string, unknown> | undefined)?.nonce === 'string' ? (message.meta as Record<string, string>).nonce : '';
  if (nonce && options.seenNonces?.has(nonce)) return false;
  return true;
}

export function toCanonicalMessage<T>(message: CanonicalMessage<T>): CanonicalMessage<T> {
  if (!validateCanonicalMessage(message)) throw new Error('INVALID_CANONICAL_SOUL_MESH_MESSAGE');
  return message;
}

export async function signMessage<T>(message: CanonicalMessage<T>, secret: Uint8Array): Promise<CanonicalMessage<T> & { hmac: string }> {
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(canonicalUnsigned(message)));
  const bytes = new Uint8Array(signature);
  const hmac = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return Object.assign({}, message, { hmac });
}

export async function verifyMessage<T>(message: CanonicalMessage<T> & { hmac: string }, secret: Uint8Array, options: MessageSecurityOptions = {}): Promise<boolean> {
  if (!validateCanonicalMessage(message, options)) throw new Error('INVALID_CANONICAL_SOUL_MESH_MESSAGE');
  const key = await importKey(secret);
  const valid = await crypto.subtle.verify('HMAC', key, hexToBytes(message.hmac), encoder.encode(canonicalUnsigned(message)));
  if (!valid) throw new Error('INVALID_SOUL_MESH_HMAC');
  const nonce = typeof message.meta?.nonce === 'string' ? message.meta.nonce : '';
  if (nonce) options.seenNonces?.add(nonce);
  return true;
}
