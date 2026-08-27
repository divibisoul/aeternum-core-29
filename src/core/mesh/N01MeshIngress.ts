import type { SoulMeshMessage } from './SoulMeshProtocol';
import { isSoulMeshMessage } from './SoulMeshProtocol';
import { N01_PEERS, type N01PeerId } from './N01Channels';
import { n01SessionAuth, type N01SessionAuth } from './N01SessionAuth';
import { SoulMeshRouter } from './SoulMeshRouter';

export function readBearerToken(authorization: string | null | undefined): string | undefined {
  const value = authorization?.trim();
  if (!value) return undefined;
  const [scheme, token] = value.split(/\s+/, 2);
  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
}

export class N01MeshIngress {
  constructor(private readonly router: SoulMeshRouter, private readonly auth: N01SessionAuth = n01SessionAuth) {}

  routeFor(peerId: N01PeerId): string {
    if (!N01_PEERS.includes(peerId)) throw new Error('UNKNOWN_PEER');
    return `/mesh/in/${peerId}`;
  }

  async accept(peerId: N01PeerId, message: unknown, authorization?: string | null): Promise<SoulMeshMessage | undefined> {
    if (!isSoulMeshMessage(message)) throw new Error('INVALID_SOUL_MESH_MESSAGE');
    if (message.source !== peerId || message.target !== 'N01') throw new Error('N01_INGRESS_IDENTITY_MISMATCH');
    const token = readBearerToken(authorization);
    if (!this.auth.verify(peerId, token ?? '')) throw new Error('N01_INGRESS_UNAUTHORIZED');
    return this.router.ingest(message);
  }
}
