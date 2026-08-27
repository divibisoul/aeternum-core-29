import type { SoulMeshCapability } from './SoulMeshCapabilities';
import type { SoulNucleus } from './SoulMeshProtocol';

/** Keeps remote advertisements separate from N01-owned capabilities. */
export class SoulMeshRemoteCapabilityRegistry {
  private readonly peers = new Map<Exclude<SoulNucleus, 'N01'>, Map<string, SoulMeshCapability>>();

  registerPeerCapabilities(peerId: Exclude<SoulNucleus, 'N01'>, capabilities: readonly SoulMeshCapability[]): void {
    for (const capability of capabilities) {
      if (capability.owner !== peerId) throw new Error(`Remote capability ${capability.id} owner mismatch: expected ${peerId}`);
    }
    this.peers.set(peerId, new Map(capabilities.map(capability => [capability.id, capability])));
  }

  getPeerCapabilities(peerId: Exclude<SoulNucleus, 'N01'>): SoulMeshCapability[] {
    return [...(this.peers.get(peerId)?.values() ?? [])];
  }

  get(peerId: Exclude<SoulNucleus, 'N01'>, capabilityId: string): SoulMeshCapability | undefined {
    return this.peers.get(peerId)?.get(capabilityId);
  }

  listAll(): SoulMeshCapability[] {
    return [...this.peers.values()].flatMap(capabilities => [...capabilities.values()]);
  }
}

export const soulMeshRemoteCapabilityRegistry = new SoulMeshRemoteCapabilityRegistry();
