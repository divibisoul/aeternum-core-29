import type { SoulMeshCapability } from './SoulMeshCapabilities';
import type { SoulNucleus } from './SoulMeshProtocol';
import { SOUL_MESH_CORE_CAPABILITIES } from './SoulMeshCapabilities';

/** Registry of observed capabilities per nucleus. */
export class SoulMeshCapabilityRegistry {
  private readonly capabilities = new Map<SoulNucleus, SoulMeshCapability[]>();

  constructor() {
    for (const node of ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'] as SoulNucleus[]) {
      this.capabilities.set(node, [...SOUL_MESH_CORE_CAPABILITIES[node]]);
    }
  }

  register(node: SoulNucleus, capabilities: SoulMeshCapability[]): void {
    this.capabilities.set(node, [...capabilities]);
  }

  merge(node: SoulNucleus, capabilities: SoulMeshCapability[]): void {
    const existing = new Map(this.get(node).map(capability => [capability.id, capability]));
    for (const capability of capabilities) existing.set(capability.id, capability);
    this.capabilities.set(node, [...existing.values()]);
  }

  get(node: SoulNucleus): SoulMeshCapability[] {
    return [...(this.capabilities.get(node) ?? [])];
  }

  has(node: SoulNucleus, capabilityId: string): boolean {
    return this.get(node).some((capability) => capability.id === capabilityId);
  }

  snapshot(): Record<SoulNucleus, SoulMeshCapability[]> {
    return {
      N01: this.get('N01'), N02: this.get('N02'), N03: this.get('N03'),
      N04: this.get('N04'), N05: this.get('N05'), N06: this.get('N06'),
    };
  }
}
