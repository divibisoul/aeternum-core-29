import { AETERNUM_8_MODULES } from "../AeternumModuleMap";
import { aeternumBus } from "../EventBus";
import { aeternumHortaCore } from "../HortaCore";
import { aeternumWormhole } from "../WormholeRegistry";

export class ArchitectureGuideModule {
  readonly id = "M2.architecture-guide";
  private active = false;

  constructor() {
    this.active = aeternumHortaCore.get<boolean>(`${this.id}.active`) ?? false;
    aeternumBus.on("governance.architecture.activate", () => this.activate());
    aeternumBus.on("governance.architecture.guide", (data) => {
      void this.guide((data as { domain?: string })?.domain);
    });
  }

  activate(): void {
    this.active = true;
    aeternumHortaCore.set(`${this.id}.active`, true);
    void aeternumBus.emit("module.activated", { module: this.id });
    this.generateMap();
  }

  deactivate(): void {
    this.active = false;
    aeternumHortaCore.set(`${this.id}.active`, false);
    void aeternumBus.emit("module.deactivated", { module: this.id });
  }

  generateMap() {
    const map = {
      totalDeclaredModules: AETERNUM_8_MODULES.length,
      declaredModules: AETERNUM_8_MODULES,
      registeredModules: aeternumWormhole.list(),
      timestamp: Date.now(),
    };
    aeternumHortaCore.set("governance.architecture.map", map);
    void aeternumBus.emit("governance.architecture.map.generated", map);
    return map;
  }

  async guide(domain?: string) {
    if (!this.active) return null;
    const normalized = domain?.trim().toLowerCase();
    const modules = normalized
      ? AETERNUM_8_MODULES.filter((item) =>
          [item.name, item.id, ...item.capabilities]
            .join(" ")
            .toLowerCase()
            .includes(normalized),
        )
      : [...AETERNUM_8_MODULES];

    const result = {
      domain: domain ?? "all",
      modules,
      registry: aeternumWormhole.list(),
      timestamp: Date.now(),
    };
    await aeternumBus.emit("governance.architecture.guide.result", result);
    return result;
  }
}

export const architectureGuideModule = new ArchitectureGuideModule();
