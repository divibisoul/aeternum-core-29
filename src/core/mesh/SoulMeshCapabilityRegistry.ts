import type { SoulMeshCapability } from './SoulMeshCapabilities';
import type { SoulNucleus } from './SoulMeshProtocol';
import { SOUL_MESH_CORE_CAPABILITIES } from './SoulMeshCapabilities';

export class SoulMeshCapabilityRegistry {
  private readonly capabilities = new Map<SoulNucleus, SoulMeshCapability[]>();

  constructor() {
    for (const [node, list] of Object.entries(SOUL_MESH_CORE_CAPABILITIES) as [SoulNucleus, SoulMeshCapability[]][]) {
      this.capabilities.set(node, [...list]);
    }
  }

  register(node: SoulNucleus, capabilities: SoulMeshCapability[]): void {
    this.capabilities.set(node, [...capabilities]);
  }

  get(node: SoulNucleus): SoulMeshCapability[] {
    return [...(this.capabilities.get(node) ?? [])];
  }

  has(node: SoulNucleus, capabilityId: string): boolean {
    return this.get(node).some((capability) => capability.id === capabilityId);
  }
}
