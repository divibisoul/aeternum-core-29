import {
  CANONICAL_CONTRACT_VERSION,
  CANONICAL_PROTOCOL,
  signMessage,
  validateCanonicalMessage,
  verifyMessage,
  type CanonicalMessage,
  type MessageSecurityOptions,
} from './CanonicalMessage';
import { createSoulMeshMessage, type SoulMeshMessage, type SoulMeshKind } from '@/src/core/mesh/SoulMeshProtocol';

/** @deprecated Compatibility adapter. Use CanonicalMessage and the canonical N01–N07 Mesh contract. */
export const SOUL_MESH_VERSION = '1.0' as const;
export const SOUL_MESH_CONTRACT_VERSION = CANONICAL_CONTRACT_VERSION;
export const MESSAGE_TYPES = ['PING','HEALTH','CAPABILITY_REQUEST','TASK','TASK_RESULT','ERROR'] as const;
export type MessageType = typeof MESSAGE_TYPES[number];
export type SoulNodeId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06' | 'N07' | 'BROADCAST';

export interface SoulMeshEnvelope<T = unknown> {
  version: typeof SOUL_MESH_VERSION;
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

export interface EnvelopeValidationOptions extends MessageSecurityOptions {
  requireContractVersion?: boolean;
}

const TYPE_TO_KIND: Record<MessageType, SoulMeshKind> = {
  PING: 'request',
  HEALTH: 'request',
  CAPABILITY_REQUEST: 'request',
  TASK: 'request',
  TASK_RESULT: 'response',
  ERROR: 'error',
};
function isNodeId(value: SoulNodeId): value is Exclude<SoulNodeId, 'BROADCAST'> { return value !== 'BROADCAST'; }
function toCanonical<T>(envelope: SoulMeshEnvelope<T>): CanonicalMessage<T> {
  if (!isNodeId(envelope.source) || !isNodeId(envelope.target)) throw new Error('BROADCAST_NOT_SUPPORTED_BY_CANONICAL_ADAPTER');
  return createSoulMeshMessage({
    source: envelope.source,
    target: envelope.target,
    kind: TYPE_TO_KIND[envelope.type],
    capability: envelope.type === 'PING' ? 'mesh.ping' : envelope.type === 'HEALTH' ? 'mesh.health' : envelope.type.toLowerCase(),
    payload: envelope.payload,
    correlationId: envelope.correlationId,
  });
}

function withLegacyIdentity<T>(canonical: CanonicalMessage<T>, source: SoulNodeId, target: SoulNodeId, type: MessageType, nonce: string, hmac: string, ttl?: number): SoulMeshEnvelope<T> {
  return { version: SOUL_MESH_VERSION, contractVersion: SOUL_MESH_CONTRACT_VERSION, messageId: canonical.id, source, target, timestamp: canonical.timestamp, nonce, correlationId: canonical.correlationId, type, ttl, hmac, payload: canonical.payload };
}

export async function signEnvelope<T>(envelope: Omit<SoulMeshEnvelope<T>, 'hmac'>, secret: Uint8Array): Promise<SoulMeshEnvelope<T>> {
  const canonical = toCanonical({ ...envelope, hmac: '' });
  const signed = await signMessage({ ...canonical, meta: { ...canonical.meta, nonce: envelope.nonce } }, secret);
  return withLegacyIdentity(signed, envelope.source, envelope.target, envelope.type, envelope.nonce, signed.hmac, envelope.ttl);
}

export async function verifyEnvelope<T>(envelope: SoulMeshEnvelope<T>, secret: Uint8Array, options: EnvelopeValidationOptions = {}): Promise<boolean> {
  if (options.requireContractVersion && envelope.contractVersion !== SOUL_MESH_CONTRACT_VERSION) throw new Error('UNSUPPORTED_SOUL_MESH_CONTRACT_VERSION');
  const canonical = { ...toCanonical(envelope), id: envelope.messageId, timestamp: envelope.timestamp, correlationId: envelope.correlationId, meta: { nonce: envelope.nonce }, contractVersion: SOUL_MESH_CONTRACT_VERSION };
  if (!validateCanonicalMessage(canonical, options)) throw new Error('INVALID_CANONICAL_SOUL_MESH_MESSAGE');
  return verifyMessage({ ...canonical, hmac: envelope.hmac }, secret, options);
}

export function createEnvelope<T>(input: Omit<SoulMeshEnvelope<T>, 'version' | 'contractVersion' | 'messageId' | 'timestamp' | 'nonce' | 'hmac'>): Omit<SoulMeshEnvelope<T>, 'hmac'> {
  const canonical = createSoulMeshMessage({
    source: input.source === 'BROADCAST' ? 'N01' : input.source,
    target: input.target === 'BROADCAST' ? 'N01' : input.target,
    kind: TYPE_TO_KIND[input.type],
    capability: input.type === 'PING' ? 'mesh.ping' : input.type === 'HEALTH' ? 'mesh.health' : input.type.toLowerCase(),
    payload: input.payload,
    correlationId: input.correlationId,
  });
  const nonce = crypto.randomUUID();
  return { version: SOUL_MESH_VERSION, contractVersion: SOUL_MESH_CONTRACT_VERSION, messageId: canonical.id, source: input.source, target: input.target, timestamp: canonical.timestamp, nonce, correlationId: canonical.correlationId, type: input.type, ttl: input.ttl };
}

export { CANONICAL_PROTOCOL };
