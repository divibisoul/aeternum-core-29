export type SoulNodeId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06' | 'BROADCAST';
export type MessageType = 'PING' | 'HEALTH' | 'CAPABILITY_REQUEST' | 'TASK' | 'TASK_RESULT' | 'ERROR';

export interface SoulMeshEnvelope<T = unknown> {
  version: '1.0';
  messageId: string;
  source: SoulNodeId;
  target: SoulNodeId;
  timestamp: number;
  nonce: string;
  correlationId: string;
  type: MessageType;
  ttl?: number;
  hmac: string;
  payload: T;
}

const encoder = new TextEncoder();
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const MIN_NONCE_LENGTH = 16;

function canonical<T>(envelope: Omit<SoulMeshEnvelope<T>, 'hmac'>): string {
  return JSON.stringify({
    version: envelope.version,
    messageId: envelope.messageId,
    source: envelope.source,
    target: envelope.target,
    timestamp: envelope.timestamp,
    nonce: envelope.nonce,
    correlationId: envelope.correlationId,
    type: envelope.type,
    ttl: envelope.ttl ?? null,
    payload: envelope.payload,
  });
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function keyFromSecret(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signEnvelope<T>(envelope: Omit<SoulMeshEnvelope<T>, 'hmac'>, secret: string): Promise<SoulMeshEnvelope<T>> {
  const key = await keyFromSecret(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(canonical(envelope)));
  return { ...envelope, hmac: bytesToHex(new Uint8Array(signature)) };
}

export async function verifyEnvelope<T>(envelope: SoulMeshEnvelope<T>, secret: string, now = Date.now()): Promise<boolean> {
  if (envelope.version !== '1.0' || !envelope.messageId || !envelope.correlationId) return false;
  if (!envelope.nonce || envelope.nonce.length < MIN_NONCE_LENGTH) return false;
  if (!Number.isSafeInteger(envelope.timestamp) || Math.abs(now - envelope.timestamp) > MAX_CLOCK_SKEW_MS) return false;
  if (envelope.ttl !== undefined && (!Number.isSafeInteger(envelope.ttl) || envelope.ttl < 0 || now > envelope.timestamp + envelope.ttl)) return false;
  const { hmac, ...unsigned } = envelope;
  if (!/^[0-9a-f]{64}$/i.test(hmac)) return false;
  const key = await keyFromSecret(secret);
  return crypto.subtle.verify('HMAC', key, hexToBytes(hmac), encoder.encode(canonical(unsigned)));
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export function createNonce(bytes = 16): string {
  if (bytes < 16) throw new Error('Nonce must contain at least 16 random bytes');
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return bytesToHex(value);
}

export function createMessageId(): string {
  return crypto.randomUUID();
}

export function createCorrelationId(): string {
  return crypto.randomUUID();
}
