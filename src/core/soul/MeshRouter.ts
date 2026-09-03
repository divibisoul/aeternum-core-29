import { createEnvelope, verifyEnvelope, type SoulMeshEnvelope } from './SoulMeshEnvelope.ts';
import { resolveCanonicalTransport, frameCanonicalEnvelope, type CanonicalTransportFrame } from './CanonicalTransportAdapter.ts';
import type { TransportKind } from '../../../lib/soul-mesh/HybridTransportRegistry.ts';

export interface MeshPeer { id: SoulMeshEnvelope['source']; transports: readonly TransportKind[]; capabilities: readonly string[]; }
export interface MeshRoute { source: SoulMeshEnvelope['source']; target: SoulMeshEnvelope['target']; transport: TransportKind; }

/** N01 routing facade. Transport selection has one authority: HybridTransportRegistry via CanonicalTransportAdapter. */
export class MeshRouter {
  constructor(private readonly secret: string) {}

  selectTransport(local: readonly TransportKind[], remote: readonly TransportKind[]): TransportKind {
    return resolveCanonicalTransport(local, remote);
  }

  async createTask(
    source: SoulMeshEnvelope['source'],
    target: SoulMeshEnvelope['target'],
    payload: unknown,
    correlationId = crypto.randomUUID(),
  ): Promise<SoulMeshEnvelope> {
    if (source === target && target !== 'BROADCAST') throw new Error('SOUL_MESH_SELF_ROUTE_NOT_ALLOWED');
    return createEnvelope({
      source,
      target,
      type: 'TASK',
      payload,
      correlationId,
    }, this.secret);
  }

  frameTask<T>(envelope: SoulMeshEnvelope<T>, transport: TransportKind): CanonicalTransportFrame<T> {
    return frameCanonicalEnvelope(envelope, transport);
  }

  async verify(message: SoulMeshEnvelope, now = Date.now()): Promise<boolean> {
    return verifyEnvelope(message, this.secret, now);
  }
}
