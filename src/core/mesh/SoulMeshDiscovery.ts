import type { SoulNucleus } from './SoulMeshProtocol';
import type { DiscoveryAdapter } from './SoulMeshDiscoveryAdapter';

export type SoulMeshRegistration = {
  nucleus: Exclude<SoulNucleus, 'N01'>;
  url: string;
  capabilities: string[];
  version?: string;
  lastSeen: number;
};

/**
 * N01 discovery cache. The synchronous API remains compatible with existing callers;
 * an optional adapter makes registrations durable and hydrate-able across restarts.
 */
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

  list(): SoulMeshRegistration[] {
    return [...this.peers.values()];
  }

  /** Loads durable registrations into the hot cache. Call once during N01 startup. */
  async hydrate(): Promise<SoulMeshRegistration[]> {
    if (!this.adapter) return this.list();
    const persisted = await this.adapter.list();
    for (const peer of persisted) {
      if (/^https?:\/\//i.test(peer.endpoint)) {
        this.peers.set(peer.nucleus, {
          nucleus: peer.nucleus,
          url: peer.endpoint.replace(/\/$/, ''),
          capabilities: peer.capabilities.map(capability => typeof capability === 'string' ? capability : capability.id),
          version: peer.contractVersion,
          lastSeen: peer.lastSeen,
        });
      }
    }
    return this.list();
  }

  private async persist(registration: SoulMeshRegistration): Promise<void> {
    await this.adapter!.register({
      nucleus: registration.nucleus,
      endpoint: registration.url,
      capabilities: registration.capabilities.map(id => ({
        id,
        version: registration.version ?? 'unknown',
        description: `Advertised by ${registration.nucleus}`,
        request: true,
        response: true,
        events: false,
        owner: registration.nucleus,
        execution: 'observability',
        executionPolicy: 'REMOTE_ONLY',
      })),
      protocol: 'soul-mesh/1',
      contractVersion: registration.version ?? '1.1.0',
      registeredAt: Date.now(),
      lastSeen: registration.lastSeen,
    });
  }
}
