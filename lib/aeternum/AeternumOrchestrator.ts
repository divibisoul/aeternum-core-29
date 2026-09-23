import { aeternumBus, AeternumEventBus } from "./EventBus";
import { aeternumHortaCore, AeternumHortaCore } from "./HortaCore";
import { aeternumWormhole, AeternumWormholeRegistry } from "./WormholeRegistry";
import { AETERNUM_8_MODULES } from "./AeternumModuleMap";
import type { AeternumModuleHandler, AeternumModuleDescriptor } from "./AeternumTypes";

export class AeternumOrchestrator {
  readonly id = "aeternum-orchestrator";
  private booted = false;
  private active = new Set<string>();

  constructor(
    private readonly bus: AeternumEventBus = aeternumBus,
    private readonly state: AeternumHortaCore = aeternumHortaCore,
    private readonly registry: AeternumWormholeRegistry = aeternumWormhole,
  ) {}

  boot(): void {
    if (this.booted) return;
    for (const descriptor of AETERNUM_8_MODULES) {
      this.state.set("module." + descriptor.id + ".state", descriptor.state);
    }
    this.state.set("system.status", "BOOTED");
    this.state.set("system.bootTime", Date.now());
    this.booted = true;
    void this.bus.emit("system.boot.complete", { modules: AETERNUM_8_MODULES.length });
  }

  register(
    descriptor: AeternumModuleDescriptor,
    handler: AeternumModuleHandler,
  ): void {
    this.registry.register(descriptor, handler);
    void this.bus.emit("module.registered", {
      id: descriptor.id,
      state: descriptor.state,
    });
  }

  async activate(id: string): Promise<void> {
    const registration = this.registry.get(id);
    if (!registration) throw new Error("Unknown Aeternum module: " + id);
    this.active.add(id);
    this.state.set("module." + id + ".active", true);
    await registration.handler.activate?.();
    await this.bus.emit("module.activated", { id });
  }

  async deactivate(id: string): Promise<void> {
    const registration = this.registry.get(id);
    if (!registration) throw new Error("Unknown Aeternum module: " + id);
    this.active.delete(id);
    this.state.set("module." + id + ".active", false);
    await registration.handler.deactivate?.();
    await this.bus.emit("module.deactivated", { id });
  }

  async dispatch(id: string, event: string, data: unknown): Promise<unknown> {
    const registration = this.registry.get(id);
    if (!registration) throw new Error("Unknown Aeternum module: " + id);
    if (!this.active.has(id)) {
      throw new Error("Aeternum module is inactive: " + id);
    }
    await this.bus.emit(event, data);
    return registration.handler.handle?.(event, data);
  }

  listModules(): readonly AeternumModuleDescriptor[] {
    return AETERNUM_8_MODULES;
  }
}
