import { verifyEnvelope, type SoulMeshEnvelope } from './SoulMeshEnvelope';
import {
  emitCanonicalEnvelope,
  rankCompatible,
  supportsBidirectional,
  type TransportKind,
} from '../../../lib/soul-mesh/HybridTransportRegistry';

export interface CanonicalTransportFrame<T = unknown> {
  envelope: SoulMeshEnvelope<T>;
  transport: TransportKind;
}

/** Validates the existing v1.0 envelope before a transport adapter accepts it. */
export async function acceptCanonicalEnvelope<T>(
  envelope: SoulMeshEnvelope<T>,
  secret: string,
  now = Date.now(),
): Promise<SoulMeshEnvelope<T>> {
  if (!(await verifyEnvelope(envelope, secret, now))) {
    throw new Error('INVALID_SOUL_MESH_ENVELOPE');
  }
  return envelope;
}

/** Resolves a common bidirectional transport without replacing the existing registry. */
export function resolveCanonicalTransport(
  local: readonly TransportKind[],
  remote: readonly TransportKind[],
): TransportKind {
  const transport = rankCompatible(local, remote);
  if (!transport || !supportsBidirectional(transport)) {
    throw new Error('NO_COMPATIBLE_BIDIRECTIONAL_TRANSPORT');
  }
  return transport;
}

/** Emits the unchanged canonical envelope through the selected transport. */
export function frameCanonicalEnvelope<T>(
  envelope: SoulMeshEnvelope<T>,
  transport: TransportKind,
): CanonicalTransportFrame<T> {
  return emitCanonicalEnvelope(envelope, transport);
}
