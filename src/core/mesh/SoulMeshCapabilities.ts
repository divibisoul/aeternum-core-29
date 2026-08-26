import type { SoulNucleus } from './SoulMeshProtocol';

export type SoulMeshCapability = {
  id: string;
  version: string;
  description: string;
  request: boolean;
  response: boolean;
  events: boolean;
  owner: SoulNucleus;
  execution: 'cognitive' | 'tool' | 'native' | 'orchestration' | 'observability';
};

export const SOUL_MESH_CORE_CAPABILITIES: Record<SoulNucleus, SoulMeshCapability[]> = {
  N01: [
    { id: 'mesh.handshake', version: '1.1', description: 'Mesh negotiation and capability discovery', request: true, response: true, events: false, owner: 'N01', execution: 'observability' },
    { id: 'mesh.health', version: '1.1', description: 'Runtime and transport health', request: true, response: true, events: true, owner: 'N01', execution: 'observability' },
    { id: 'mesh.capabilities', version: '1.1', description: 'Advertise executable N01 capabilities', request: true, response: true, events: true, owner: 'N01', execution: 'observability' },
    { id: 'cognitive.intent', version: '1.0', description: 'Intent analysis through N01 cognitive pipeline', request: true, response: true, events: false, owner: 'N01', execution: 'cognitive' },
    { id: 'agi.process', version: '1.0', description: 'AeternumAGI processing adapter', request: true, response: true, events: true, owner: 'N01', execution: 'cognitive' },
    { id: 'ai.reasoning', version: '1.0', description: 'Provider-neutral reasoning adapter', request: true, response: true, events: true, owner: 'N01', execution: 'cognitive' },
    { id: 'android.device_info', version: '1.0', description: 'Observed Android device information', request: true, response: true, events: false, owner: 'N01', execution: 'native' },
    { id: 'android.battery', version: '1.0', description: 'Observed Android battery state', request: true, response: true, events: true, owner: 'N01', execution: 'native' },
    { id: 'android.memory', version: '1.0', description: 'Observed Android memory state', request: true, response: true, events: true, owner: 'N01', execution: 'native' },
    { id: 'android.network', version: '1.0', description: 'Observed Android network state', request: true, response: true, events: true, owner: 'N01', execution: 'native' },
  ],
  N02: [{ id: 'mesh.handshake', version: '1.1', description: 'Mesh negotiation and capability discovery', request: true, response: true, events: false, owner: 'N02', execution: 'observability' }],
  N03: [{ id: 'mesh.handshake', version: '1.1', description: 'Mesh negotiation and capability discovery', request: true, response: true, events: false, owner: 'N03', execution: 'observability' }],
  N04: [{ id: 'mesh.handshake', version: '1.1', description: 'Mesh negotiation and capability discovery', request: true, response: true, events: false, owner: 'N04', execution: 'observability' }],
  N05: [{ id: 'mesh.handshake', version: '1.1', description: 'Mesh negotiation and capability discovery', request: true, response: true, events: false, owner: 'N05', execution: 'observability' }],
  N06: [{ id: 'mesh.handshake', version: '1.1', description: 'Mesh negotiation and capability discovery', request: true, response: true, events: false, owner: 'N06', execution: 'observability' }],
};

export class SoulMeshCapabilityRegistry {
  private readonly registry = new Map<SoulNucleus, Map<string, SoulMeshCapability>>();

  register(nucleus: SoulNucleus, capabilities: readonly SoulMeshCapability[]): void {
    this.registry.set(nucleus, this.toMap(nucleus, capabilities));
  }

  merge(nucleus: SoulNucleus, capabilities: readonly SoulMeshCapability[]): void {
    const map = this.registry.get(nucleus) ?? new Map<string, SoulMeshCapability>();
    for (const capability of capabilities) {
      if (this.isOwnedCapability(nucleus, capability)) map.set(capability.id, capability);
    }
    this.registry.set(nucleus, map);
  }

  /** Atomically replace a peer's advertised snapshot; stale capabilities disappear. */
  sync(nucleus: SoulNucleus, capabilities: readonly SoulMeshCapability[]): void {
    this.register(nucleus, capabilities);
  }

  list(nucleus: SoulNucleus): SoulMeshCapability[] {
    return [...(this.registry.get(nucleus)?.values() ?? [])];
  }

  get(nucleus: SoulNucleus, capabilityId: string): SoulMeshCapability | undefined {
    return this.registry.get(nucleus)?.get(capabilityId);
  }

  canRequest(nucleus: SoulNucleus, capabilityId: string): boolean {
    return this.get(nucleus, capabilityId)?.request === true;
  }

  has(nucleus: SoulNucleus): boolean {
    return this.registry.has(nucleus);
  }

  clear(nucleus?: SoulNucleus): void {
    if (nucleus) this.registry.delete(nucleus);
    else this.registry.clear();
  }

  private toMap(nucleus: SoulNucleus, capabilities: readonly SoulMeshCapability[]): Map<string, SoulMeshCapability> {
    const map = new Map<string, SoulMeshCapability>();
    for (const capability of capabilities) {
      if (this.isOwnedCapability(nucleus, capability)) map.set(capability.id, capability);
    }
    return map;
  }

  private isOwnedCapability(nucleus: SoulNucleus, capability: SoulMeshCapability): boolean {
    return capability.owner === nucleus && Boolean(capability.id) && Boolean(capability.version);
  }
}

export const soulMeshCapabilityRegistry = new SoulMeshCapabilityRegistry();
