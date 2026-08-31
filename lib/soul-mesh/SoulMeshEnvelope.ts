export const SOUL_MESH_VERSION = '1.0' as const;
export const SOUL_MESH_CONTRACT_VERSION = '1.1.0' as const;

export const MESSAGE_TYPES = [
  'PING',
  'HEALTH',
  'CAPABILITY_REQUEST',
  'TASK',
  'TASK_RESULT',
  'ERROR',
] as const;

export type MessageType = typeof MESSAGE_TYPES[number];
export type SoulNodeId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06' | 'BROADCAST';

export interface SoulMeshEnvelope<T = unknown> {
  /** Legacy transport version; preserved for backward compatibility. */
  version: typeof SOUL_MESH_VERSION;
  /** Canonical cross-nucleus contract version. */
  contractVersion: typeof SOUL_MESH_CONTRACT_VERSION;
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

export interface EnvelopeValidationOptions {
  nowMs?: number;
  maxClockSkewMs?: number;
  seenNonces?: Set<string>;
  /** Strict mode is opt-in so existing legacy traffic is not broken during migration. */
  requireContractVersion?: boolean;
}

const encoder = new TextEncoder();

function canonicalUnsignedEnvelope<T>(envelope: SoulMeshEnvelope<T>): string {
  return JSON.stringify({
    version: envelope.version,
    contractVersion: envelope.contractVersion,
    messageId: envelope.messageId,
    source: envelope.source,
    target: envelope.target,
    timestamp: envelope.timestamp,
    nonce: envelope.nonce,
    correlationId: envelope.correlationId,
    type: envelope.type,
    ...(envelope.ttl === undefined ? {} : { ttl: envelope.ttl }),
    payload: envelope.payload,
  });
}

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new Error('Invalid HMAC-SHA256 value');
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  return bytes;
}

async function importHmacKey(secret: Uint8Array): Promise<CryptoKey> {
  if (secret.byteLength < 16) throw new Error('HMAC secret must contain at least 16 bytes');
  return crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signEnvelope<T>(envelope: Omit<SoulMeshEnvelope<T>, 'hmac'>, secret: Uint8Array): Promise<SoulMeshEnvelope<T>> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(canonicalUnsignedEnvelope({ ...envelope, hmac: '' })));
  return { ...envelope, hmac: bytesToHex(signature) };
}

export async function verifyEnvelope<T>(envelope: SoulMeshEnvelope<T>, secret: Uint8Array, options: EnvelopeValidationOptions = {}): Promise<boolean> {
  if (envelope.version !== SOUL_MESH_VERSION) throw new Error('Unsupported SOUL Mesh envelope version');
  if (options.requireContractVersion && envelope.contractVersion !== SOUL_MESH_CONTRACT_VERSION) throw new Error('Unsupported SOUL Mesh contract version');
  if (!MESSAGE_TYPES.includes(envelope.type)) throw new Error(`Unsupported message type: ${envelope.type}`);
  if (!envelope.messageId || !envelope.nonce || !envelope.correlationId) throw new Error('Envelope identity fields are required');
  if (envelope.source === envelope.target && envelope.target !== 'BROADCAST') throw new Error('Envelope source and target cannot be identical');
  if (envelope.ttl !== undefined && (!Number.isInteger(envelope.ttl) || envelope.ttl < 0)) throw new Error('Invalid envelope TTL');

  const nowMs = options.nowMs ?? Date.now();
  const maxClockSkewMs = options.maxClockSkewMs ?? 30_000;
  if (!Number.isFinite(envelope.timestamp) || Math.abs(nowMs - envelope.timestamp) > maxClockSkewMs) throw new Error('Envelope timestamp outside accepted clock skew');

  if (options.seenNonces?.has(envelope.nonce)) throw new Error('Replay detected: nonce already observed');

  const key = await importHmacKey(secret);
  const valid = await crypto.subtle.verify('HMAC', key, hexToBytes(envelope.hmac), encoder.encode(canonicalUnsignedEnvelope(envelope)));
  if (!valid) throw new Error('Invalid SOUL Mesh HMAC');

  options.seenNonces?.add(envelope.nonce);
  return true;
}

export function createEnvelope<T>(input: Omit<SoulMeshEnvelope<T>, 'version' | 'contractVersion' | 'messageId' | 'timestamp' | 'nonce' | 'hmac'>): Omit<SoulMeshEnvelope<T>, 'hmac'> {
  return {
    ...input,
    version: SOUL_MESH_VERSION,
    contractVersion: SOUL_MESH_CONTRACT_VERSION,
    messageId: crypto.randomUUID(),
    timestamp: Date.now(),
    nonce: crypto.randomUUID(),
  };
}
