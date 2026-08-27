import type { SoulMeshCapability } from './SoulMeshCapabilities';
import type { SoulNucleus } from './SoulMeshProtocol';
import { SoulMeshDiscoveryRegistry } from './SoulMeshDiscovery';
import { N01SessionAuth, type N01SessionTokenRecord } from './N01SessionAuth';

type N01RemotePeer = Exclude<SoulNucleus, 'N01'>;

export interface N01PeerRegistrationRequest {
  peerId: N01RemotePeer;
  endpoint: string;
  capabilities: SoulMeshCapability[];
  contractVersion?: string;
}

export interface N01PeerRegistrationResponse {
  accepted: true;
  peerId: N01RemotePeer;
  token: string;
  peers: ReturnType<SoulMeshDiscoveryRegistry['list']>;
}

export class N01PeerRegistrationService {
  constructor(
    private readonly discovery: SoulMeshDiscoveryRegistry,
    private readonly auth: N01SessionAuth,
    private readonly onCapabilities: (peerId: N01RemotePeer, capabilities: SoulMeshCapability[]) => void,
  ) {}

  async register(request: N01PeerRegistrationRequest): Promise<N01PeerRegistrationResponse> {
    if (!/^https?:\/\//i.test(request.endpoint)) throw new Error('INVALID_PEER_ENDPOINT');
    const session: N01SessionTokenRecord = await this.auth.issue(request.peerId);
    this.discovery.register({
      nucleus: request.peerId,
      url: request.endpoint.replace(/\/$/, ''),
      capabilities: request.capabilities.map((capability) => capability.id),
      version: request.contractVersion ?? '1.1.0',
      authToken: session.token,
      lastSeen: Date.now(),
    });
    this.onCapabilities(request.peerId, request.capabilities);
    return { accepted: true, peerId: request.peerId, token: session.token, peers: this.discovery.list() };
  }

  verify(peerId: N01RemotePeer, token: string): boolean {
    return this.auth.verify(peerId, token);
  }
}
