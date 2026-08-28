import { createEnvelope, verifyEnvelope, type SoulMeshEnvelope } from './SoulMeshEnvelope';
import { rankCompatible, type TransportKind } from '../../../lib/soul-mesh/HybridTransportRegistry';

export interface MeshPeer { id: SoulMeshEnvelope['source']; transports: readonly TransportKind[]; capabilities: readonly string[]; }
export interface MeshRoute { source: SoulMeshEnvelope['source']; target: SoulMeshEnvelope['target']; transport: TransportKind; }

export class MeshRouter {
  constructor(private readonly secret: string) {}

  selectTransport(local: readonly TransportKind[], remote: readonly TransportKind[]): TransportKind {
    const selected = rankCompatible(local, remote);
    if (!selected) throw new Error('NO_COMPATIBLE_TRANSPORT');
    return selected;
  }

  async createTask(source: SoulMeshEnvelope['source'], target: SoulMeshEnvelope['target'], payload: unknown, correlationId?: string) {
    return createEnvelope({ version: '1.0', source, target, type: 'TASK', payload, correlationId }, this.secret);
  }

  async verify(message: SoulMeshEnvelope, now = Date.now()): Promise<boolean> {
    return verifyEnvelope(message, this.secret, now);
  }
}
