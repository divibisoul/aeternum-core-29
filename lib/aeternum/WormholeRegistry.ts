import type {
  AeternumModuleDescriptor,
  AeternumModuleHandler,
} from "./AeternumTypes";

interface Registration {
  descriptor: AeternumModuleDescriptor;
  handler: AeternumModuleHandler;
  registeredAt: number;
}

/**
 * The Wormhole is the module registry/connection authority.
 *
 * Declaration and executable registration are intentionally separate:
 * a remote nucleus can be known by the architecture graph before its
 * real handler is connected. No synthetic handler is created.
 */
export class AeternumWormholeRegistry {
  private readonly declared = new Map<string, AeternumModuleDescriptor>();
  private readonly modules = new Map<string, Registration>();
  private readonly connections = new Map<string, Set<string>>();

  declare(descriptor: AeternumModuleDescriptor): void {
    const existing = this.declared.get(descriptor.id);
    if (existing) {
      if (existing.name !== descriptor.name || existing.owner !== descriptor.owner) {
        throw new Error("Aeternum module declaration conflict: " + descriptor.id);
      }
      return;
    }
    this.declared.set(descriptor.id, descriptor);
  }

  register(
    descriptor: AeternumModuleDescriptor,
    handler: AeternumModuleHandler,
  ): void {
    this.declare(descriptor);
    if (this.modules.has(descriptor.id)) {
      throw new Error("Aeternum module already registered: " + descriptor.id);
    }
    this.modules.set(descriptor.id, {
      descriptor,
      handler,
      registeredAt: Date.now(),
    });
  }

  get(id: string): Registration | undefined {
    return this.modules.get(id);
  }

  listDeclared(): AeternumModuleDescriptor[] {
    return [...this.declared.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  list(): AeternumModuleDescriptor[] {
    return [...this.modules.values()]
      .map(item => item.descriptor)
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  connect(sourceId: string, targetId: string): void {
    if (!this.declared.has(sourceId) || !this.declared.has(targetId)) {
      throw new Error("Cannot connect unknown Aeternum module");
    }
    const targets = this.connections.get(sourceId) ?? new Set<string>();
    targets.add(targetId);
    this.connections.set(sourceId, targets);
  }

  getConnections(sourceId: string): string[] {
    return [...(this.connections.get(sourceId) ?? new Set<string>())].sort();
  }

  listConnections(): Array<{ sourceId: string; targetId: string }> {
    return [...this.connections.entries()]
      .flatMap(([sourceId, targets]) =>
        [...targets].map(targetId => ({ sourceId, targetId })),
      )
      .sort((a, b) =>
        a.sourceId === b.sourceId
          ? a.targetId.localeCompare(b.targetId)
          : a.sourceId.localeCompare(b.sourceId),
      );
  }

  findByCapability(capability: string): string[] {
    return this.listDeclared()
      .filter(item => item.capabilities.includes(capability))
      .map(item => item.id);
  }
}

export const aeternumWormhole = new AeternumWormholeRegistry();
