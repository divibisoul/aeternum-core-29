import type { SoulMeshCapability } from './SoulMeshCapabilities';
import type { SoulNucleus } from './SoulMeshProtocol';
import { SoulMeshDiscoveryRegistry, type SoulMeshRegistration } from './SoulMeshDiscovery';
import { SoulMeshCapabilityRegistry } from './SoulMeshCapabilityRegistry';

/** N01-facing registry facade. Keeps topology and remote capability state synchronized. */
export class SoulMeshPeerRegistry {
  constructor(
    private readonly discovery: SoulMeshDiscoveryRegistry,
    private readonly capabilityRegistry: SoulMeshCapabilityRegistry,
  ) {}

  registerPeer(registration: SoulMeshRegistration): SoulMeshRegistration {
    return this.discovery.register(registration);
  }

  registerPeerCapabilities(peerId: Exclude<SoulNucleus, 'N01'>, capabilities: readonly SoulMeshCapability[]): void {
    this.capabilityRegistry.registerPeerCapabilities(peerId, capabilities);
  }

  resolve(peerId: Exclude<SoulNucleus, 'N01'>): SoulMeshRegistration | undefined {
    return this.discovery.resolve(peerId);
  }

  capabilities(peerId: SoulNucleus): SoulMeshCapability[] {
    return this.capabilityRegistry.get(peerId);
  }

  allCapabilities(): SoulMeshCapability[] {
    return this.capabilityRegistry.getCombined();
  }

  async hydrate(): Promise<SoulMeshRegistration[]> {
    return this.discovery.hydrate();
  }

  list(): SoulMeshRegistration[] {
    return this.discovery.list();
  }
}
