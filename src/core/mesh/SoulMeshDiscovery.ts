import type { SoulNucleus } from './SoulMeshProtocol';

export type SoulMeshRegistration = {
  nucleus: Exclude<SoulNucleus, 'N01'>;
  url: string;
  capabilities: string[];
  version?: string;
  lastSeen: number;
};

/** In-memory registry used by N01 as the primary discovery abstraction. */
export class SoulMeshDiscoveryRegistry {
  private readonly peers = new Map<Exclude<SoulNucleus, 'N01'>, SoulMeshRegistration>();

  register(registration: SoulMeshRegistration): SoulMeshRegistration {
    if (!/^https?:\/\//i.test(registration.url)) throw new Error('INVALID_PEER_URL');
    this.peers.set(registration.nucleus, { ...registration, lastSeen: Date.now() });
    return this.peers.get(registration.nucleus)!;
  }

  resolve(nucleus: Exclude<SoulNucleus, 'N01'>): SoulMeshRegistration | undefined { return this.peers.get(nucleus); }

  updateCapabilities(nucleus: Exclude<SoulNucleus, 'N01'>, capabilities: string[], version?: string): SoulMeshRegistration | undefined {
    const peer = this.peers.get(nucleus);
    if (!peer) return undefined;
    peer.capabilities = [...new Set(capabilities)].sort();
    if (version) peer.version = version;
    peer.lastSeen = Date.now();
    return peer;
  }

  heartbeat(nucleus: Exclude<SoulNucleus, 'N01'>): boolean {
    const peer = this.peers.get(nucleus);
    if (!peer) return false;
    peer.lastSeen = Date.now();
    return true;
  }

  list(): SoulMeshRegistration[] { return [...this.peers.values()]; }
}
