import { verifyEnvelope, type SoulMeshEnvelope } from './SoulMeshEnvelope.ts';
import {
  rankCompatible,
  supportsBidirectional,
  type TransportKind,
} from '../../../lib/soul-mesh/HybridTransportRegistry.ts';

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

/** Resolves a common bidirectional transport through the existing registry (single source of truth). */
export function resolveCanonicalTransport(
  local: readonly TransportKind[],
  remote: readonly TransportKind[],
): TransportKind {
  const selected = rankCompatible(local, remote);
  if (!selected || !supportsBidirectional(selected)) {
    throw new Error('NO_COMPATIBLE_BIDIRECTIONAL_TRANSPORT');
  }
  return selected;
}

/** Emits the unchanged canonical envelope through a registered bidirectional transport. */
export function frameCanonicalEnvelope<T>(
  envelope: SoulMeshEnvelope<T>,
  transport: TransportKind,
): CanonicalTransportFrame<T> {
  if (!supportsBidirectional(transport)) {
    throw new Error(`UNSUPPORTED_TRANSPORT:${transport}`);
  }
  return { envelope, transport };
}
