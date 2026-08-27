import type { SoulNucleus } from './SoulMeshProtocol';
import type { SoulMeshCapability } from './SoulMeshCapabilities';
import type { DiscoveryAdapter } from './SoulMeshDiscoveryAdapter';

export type SoulMeshRegistration = {
  nucleus: Exclude<SoulNucleus, 'N01'>;
  url: string;
  capabilities: string[];
  capabilityDescriptors?: SoulMeshCapability[];
  version?: string;
  authToken?: string;
  lastSeen: number;
};

/** N01 discovery cache with durable persistence and a hot in-memory path. */
export class SoulMeshDiscoveryRegistry {
  private readonly peers = new Map<Exclude<SoulNucleus, 'N01'>, SoulMeshRegistration>();

  constructor(private readonly adapter?: DiscoveryAdapter) {}

  register(registration: SoulMeshRegistration): SoulMeshRegistration {
    if (!/^https?:\/\//i.test(registration.url)) throw new Error('INVALID_PEER_URL');
    const normalized = { ...registration, url: registration.url.replace(/\/$/, ''), lastSeen: Date.now() };
    this.peers.set(registration.nucleus, normalized);
    if (this.adapter) void this.persist(normalized);
    return normalized;
  }

  resolve(nucleus: Exclude<SoulNucleus, 'N01'>): SoulMeshRegistration | undefined {
    return this.peers.get(nucleus);
  }

  heartbeat(nucleus: Exclude<SoulNucleus, 'N01'>): boolean {
    const peer = this.peers.get(nucleus);
    if (!peer) return false;
    peer.lastSeen = Date.now();
    if (this.adapter) void this.persist(peer);
    return true;
  }

  list(): SoulMeshRegistration[] { return [...this.peers.values()]; }

  async hydrate(): Promise<SoulMeshRegistration[]> {
    if (!this.adapter) return this.list();
    const persisted = await this.adapter.list();
    for (const peer of persisted) {
      if (!/^https?:\/\//i.test(peer.endpoint)) continue;
      const descriptors = peer.capabilities.map((capability) => typeof capability === 'string' ? undefined : capability).filter(Boolean) as SoulMeshCapability[];
      this.peers.set(peer.nucleus, {
        nucleus: peer.nucleus,
        url: peer.endpoint.replace(/\/$/, ''),
        capabilities: descriptors.length ? descriptors.map(capability => capability.id) : [],
        capabilityDescriptors: descriptors,
        version: peer.contractVersion,
        authToken: peer.authToken,
        lastSeen: peer.lastSeen,
      });
    }
    return this.list();
  }

  private async persist(registration: SoulMeshRegistration): Promise<void> {
    const advertised = registration.capabilityDescriptors ?? [];
    await this.adapter!.register({
      nucleus: registration.nucleus,
      endpoint: registration.url,
      capabilities: advertised,
      protocol: 'soul-mesh/1',
      contractVersion: registration.version ?? '1.1.0',
      authToken: registration.authToken,
      registeredAt: registration.lastSeen,
      lastSeen: registration.lastSeen,
    });
  }
}
