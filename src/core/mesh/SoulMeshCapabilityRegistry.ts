import type { SoulMeshCapability } from './SoulMeshCapabilities';
import type { SoulNucleus } from './SoulMeshProtocol';
import { SOUL_MESH_CORE_CAPABILITIES } from './SoulMeshCapabilities';

/** Runtime capability registry with ownership validation and additive updates. */
export class SoulMeshCapabilityRegistry {
  private readonly capabilities = new Map<SoulNucleus, Map<string, SoulMeshCapability>>();

  constructor() {
    for (const [node, list] of Object.entries(SOUL_MESH_CORE_CAPABILITIES) as [SoulNucleus, SoulMeshCapability[]][]) {
      this.capabilities.set(node, new Map(list.map(capability => [capability.id, capability])));
    }
  }

  register(node: SoulNucleus, capabilities: SoulMeshCapability[]): void {
    const existing = this.capabilities.get(node) ?? new Map<string, SoulMeshCapability>();
    for (const capability of capabilities) {
      if (capability.owner !== node) throw new Error(`Capability ${capability.id} cannot be registered under ${node}; owner is ${capability.owner}`);
      existing.set(capability.id, capability);
    }
    this.capabilities.set(node, existing);
  }

  registerPeerCapabilities(peerId: Exclude<SoulNucleus, 'N01'>, capabilities: readonly SoulMeshCapability[]): void {
    this.register(peerId, [...capabilities]);
  }

  get(node: SoulNucleus): SoulMeshCapability[] {
    return [...(this.capabilities.get(node)?.values() ?? [])];
  }

  getCombined(): SoulMeshCapability[] {
    return [...this.capabilities.values()].flatMap((nodeCapabilities) => [...nodeCapabilities.values()]);
  }

  has(node: SoulNucleus, capabilityId: string): boolean {
    return this.capabilities.get(node)?.has(capabilityId) ?? false;
  }

  owner(capabilityId: string): SoulNucleus | undefined {
    for (const [node, capabilities] of this.capabilities) if (capabilities.has(capabilityId)) return node;
    return undefined;
  }
}
