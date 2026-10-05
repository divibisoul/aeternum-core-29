/**
 * N01 canonical transport registry facade.
 *
 * Non-destructive boundary: the historical HybridTransportRegistry and both
 * envelope implementations remain intact. This module adds the missing
 * integration point so the N01 core router can create/verify the canonical
 * 1.1.0 envelope while legacy callers continue to use their existing APIs.
 */
import {
  createEnvelope as createCanonicalEnvelope,
  signEnvelope as signCanonicalEnvelope,
  verifyEnvelope as verifyCanonicalEnvelope,
  SOUL_MESH_CONTRACT_VERSION,
  SOUL_MESH_VERSION,
  type SoulMeshEnvelope as CanonicalSoulMeshEnvelope,
  type SoulNodeId,
  type MessageType,
  type EnvelopeValidationOptions,
} from '../../../lib/soul-mesh/SoulMeshEnvelope.ts';
import {
  NUCLEUS_ID,
  TRANSPORTS,
  N01_TRANSPORT_REGISTRY,
  rankCompatible,
  supportsBidirectional,
  type TransportKind,
  type TransportDescriptor,
  type TransportStatus,
  type EnvelopeTransport,
} from '../../../lib/soul-mesh/HybridTransportRegistry.ts';

export {
  NUCLEUS_ID,
  TRANSPORTS,
  N01_TRANSPORT_REGISTRY,
  rankCompatible,
  supportsBidirectional,
  SOUL_MESH_VERSION,
  SOUL_MESH_CONTRACT_VERSION,
};

export type {
  TransportKind,
  TransportDescriptor,
  TransportStatus,
  EnvelopeTransport,
  CanonicalSoulMeshEnvelope,
  SoulNodeId,
  MessageType,
  EnvelopeValidationOptions,
};

export type LegacyN01MeshEnvelope<T = unknown> = {
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
};

function secretToBytes(secret: string | Uint8Array): Uint8Array {
  return typeof secret === 'string' ? new TextEncoder().encode(secret) : secret;
}

/**
 * Converts the pre-canonical N01 envelope shape to the canonical contract.
 * The legacy HMAC is deliberately not copied because its signed bytes differ
 * from the canonical contract (contractVersion is now part of the signature).
 */
export function normalizeLegacyEnvelope<T>(
  legacy: LegacyN01MeshEnvelope<T>,
): Omit<CanonicalSoulMeshEnvelope<T>, 'hmac'> {
  return {
    version: SOUL_MESH_VERSION,
    contractVersion: SOUL_MESH_CONTRACT_VERSION,
    messageId: legacy.messageId,
    source: legacy.source,
    target: legacy.target,
    timestamp: legacy.timestamp,
    nonce: legacy.nonce,
    correlationId: legacy.correlationId,
    type: legacy.type,
    ...(legacy.ttl === undefined ? {} : { ttl: legacy.ttl }),
    payload: legacy.payload,
  };
}

export async function signTransportEnvelope<T>(
  message:
    | Omit<CanonicalSoulMeshEnvelope<T>, 'hmac'>
    | LegacyN01MeshEnvelope<T>,
  secret: string | Uint8Array,
): Promise<CanonicalSoulMeshEnvelope<T>> {
  const canonical =
    'contractVersion' in message
      ? message
      : normalizeLegacyEnvelope(message);
  return signCanonicalEnvelope(canonical, secretToBytes(secret));
}

export async function verifyTransportEnvelope<T>(
  message: CanonicalSoulMeshEnvelope<T>,
  secret: string | Uint8Array,
  options: EnvelopeValidationOptions = {},
): Promise<boolean> {
  return verifyCanonicalEnvelope(message, secretToBytes(secret), {
    ...options,
    requireContractVersion: true,
  });
}

export async function createTaskEnvelope<T>(
  source: SoulNodeId,
  target: SoulNodeId,
  payload: T,
  secret: string | Uint8Array,
  correlationId = crypto.randomUUID(),
): Promise<CanonicalSoulMeshEnvelope<T>> {
  const unsigned = createCanonicalEnvelope({
    source,
    target,
    type: 'TASK',
    payload,
    correlationId,
  });
  return signCanonicalEnvelope(unsigned, secretToBytes(secret));
}
