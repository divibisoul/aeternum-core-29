import { aeternumBus } from "../EventBus";
import { aeternumHortaCore } from "../HortaCore";

export type SystemMode = "HARMONY" | "ANALYSIS" | "ABSTRACT" | "SYNTHESIS";
export interface SystemPanelState {
  activeMode: SystemMode | null;
  activeModules: string[];
  systemHealth: number | null;
  coherence: number | null;
  uptime: number | null;
}

export class SystemPanelModule {
  readonly id = "system-panel";
  private active = false;
  private state: SystemPanelState = {
    activeMode: null, activeModules: [], systemHealth: null, coherence: null, uptime: null,
  };

  constructor() {
    void aeternumBus.on("mode.changed", (data: { mode?: string }) => {
      if (data?.mode && ["HARMONY","ANALYSIS","ABSTRACT","SYNTHESIS"].includes(data.mode)) {
        this.state.activeMode = data.mode as SystemMode;
        this.publish();
      }
    });
    void aeternumBus.on("module.activated", (data: { id?: string; module?: string }) => {
      const id = data.id ?? data.module;
      if (id && !this.state.activeModules.includes(id)) this.state.activeModules = [...this.state.activeModules, id];
      this.publish();
    });
    void aeternumBus.on("module.deactivated", (data: { id?: string; module?: string }) => {
      const id = data.id ?? data.module;
      if (id) this.state.activeModules = this.state.activeModules.filter(item => item !== id);
      this.publish();
    });
  }

  activate(): void {
    this.active = true;
    aeternumHortaCore.set(this.id + ".active", true);
    void aeternumBus.emit("module.activated", { id: this.id });
  }

  deactivate(): void {
    this.active = false;
    aeternumHortaCore.set(this.id + ".active", false);
    void aeternumBus.emit("module.deactivated", { id: this.id });
  }

  requestModeChange(mode: SystemMode): void {
    void aeternumBus.emit("mode.change.request", { mode });
  }

  setObservedHealth(health: number): void {
    if (!Number.isFinite(health) || health < 0 || health > 100) throw new Error("SYSTEM_HEALTH_INVALID");
    this.state.systemHealth = health;
    this.publish();
  }

  setObservedCoherence(coherence: number): void {
    if (!Number.isFinite(coherence) || coherence < 0 || coherence > 1) throw new Error("COHERENCE_INVALID");
    this.state.coherence = coherence;
    this.publish();
  }

  getState(): SystemPanelState { return { ...this.state, activeModules: [...this.state.activeModules] }; }

  private publish(): void {
    aeternumHortaCore.set("system.panel.state", this.getState());
    void aeternumBus.emit("panel.state.updated", this.getState());
  }
}

export const systemPanelModule = new SystemPanelModule();
