import type {
  AeternumModuleDescriptor,
  AeternumModuleHandler,
} from "./AeternumTypes";

interface Registration {
  descriptor: AeternumModuleDescriptor;
  handler: AeternumModuleHandler;
  registeredAt: number;
}

export class AeternumWormholeRegistry {
  private readonly modules = new Map<string, Registration>();
  private readonly connections = new Map<string, Set<string>>();

  register(
    descriptor: AeternumModuleDescriptor,
    handler: AeternumModuleHandler,
  ): void {
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

  list(): AeternumModuleDescriptor[] {
    return [...this.modules.values()]
      .map(item => item.descriptor)
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  connect(sourceId: string, targetId: string): void {
    if (!this.modules.has(sourceId) || !this.modules.has(targetId)) {
      throw new Error("Cannot connect unknown Aeternum module");
    }
    const targets = this.connections.get(sourceId) ?? new Set<string>();
    targets.add(targetId);
    this.connections.set(sourceId, targets);
  }

  getConnections(sourceId: string): string[] {
    return [...(this.connections.get(sourceId) ?? new Set<string>())].sort();
  }

  findByCapability(capability: string): string[] {
    return this.list()
      .filter(item => item.capabilities.includes(capability))
      .map(item => item.id);
  }
}

export const aeternumWormhole = new AeternumWormholeRegistry();
