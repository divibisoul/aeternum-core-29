import {
  createTaskEnvelope,
  rankCompatible,
  verifyTransportEnvelope,
  type CanonicalSoulMeshEnvelope,
  type TransportKind,
} from '../mesh/TransportRegistry';

export interface MeshPeer {
  id: CanonicalSoulMeshEnvelope['source'];
  transports: readonly TransportKind[];
  capabilities: readonly string[];
}

export interface MeshRoute {
  source: CanonicalSoulMeshEnvelope['source'];
  target: CanonicalSoulMeshEnvelope['target'];
  transport: TransportKind;
}

export class MeshRouter {
  constructor(private readonly secret: string) {}

  selectTransport(local: readonly TransportKind[], remote: readonly TransportKind[]): TransportKind {
    const selected = rankCompatible(local, remote);
    if (!selected) throw new Error('NO_COMPATIBLE_TRANSPORT');
    return selected;
  }

  async createTask(
    source: CanonicalSoulMeshEnvelope['source'],
    target: CanonicalSoulMeshEnvelope['target'],
    payload: unknown,
    correlationId?: string,
  ) {
    return createTaskEnvelope(source, target, payload, this.secret, correlationId);
  }

  async verify(
    message: CanonicalSoulMeshEnvelope,
    now = Date.now(),
  ): Promise<boolean> {
    return verifyTransportEnvelope(message, this.secret, { nowMs: now });
  }
}
