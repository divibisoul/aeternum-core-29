import { verifyEnvelope, type SoulMeshEnvelope } from './SoulMeshEnvelope';
import { rankCompatible, supportsBidirectional, type TransportKind } from '../../../lib/soul-mesh/HybridTransportRegistry';

export interface CanonicalTransportFrame<T = unknown> {
  envelope: SoulMeshEnvelope<T>;
  transport: TransportKind;
}

/** Canonical adapter: validates the existing envelope and delegates transport choice to the existing registry. */
export async function acceptCanonicalEnvelope<T>(envelope: SoulMeshEnvelope<T>, secret: string, now = Date.now()): Promise<SoulMeshEnvelope<T>> {
  if (!(await verifyEnvelope(envelope, secret, now))) throw new Error('INVALID_SOUL_MESH_ENVELOPE');
  return envelope;
}

/** Single transport authority: no second registry or transport selection algorithm is created here. */
export function resolveCanonicalTransport(local: readonly TransportKind[], remote: readonly TransportKind[]): TransportKind {
  const selected = rankCompatible(local, remote);
  if (!selected || !supportsBidirectional(selected)) throw new Error('NO_COMPATIBLE_BIDIRECTIONAL_TRANSPORT');
  return selected;
}

export function frameCanonicalEnvelope<T>(envelope: SoulMeshEnvelope<T>, transport: TransportKind): CanonicalTransportFrame<T> {
  if (!supportsBidirectional(transport)) throw new Error(`UNSUPPORTED_TRANSPORT:${transport}`);
  return { envelope, transport };
}
