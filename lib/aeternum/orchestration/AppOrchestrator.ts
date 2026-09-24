import { AeternumOrchestrator } from "../AeternumOrchestrator";
import { aeternumBus } from "../EventBus";
import { aeternumHortaCore } from "../HortaCore";

export type BootPhase = "CORE" | "MODULES" | "READY";

export interface BootSnapshot {
  phase: BootPhase;
  progress: number;
  startedAt: number;
  completedAt?: number;
  evidence: {
    coreBooted: boolean;
    moduleStateCount: number;
    moduleCount: number;
  };
}

export class AppOrchestrator {
  readonly id = "app-orchestrator";
  private readonly core: AeternumOrchestrator;
  private snapshot: BootSnapshot | null = null;

  constructor(core = new AeternumOrchestrator()) {
    this.core = core;
  }

  boot(): BootSnapshot {
    if (this.snapshot?.phase === "READY") return { ...this.snapshot, evidence: { ...this.snapshot.evidence } };

    const startedAt = Date.now();
    this.snapshot = {
      phase: "CORE",
      progress: 0,
      startedAt,
      evidence: { coreBooted: false, moduleStateCount: 0, moduleCount: 0 },
    };
    void aeternumBus.emit("system.boot.phase", this.snapshot);

    this.core.boot();

    const status = aeternumHortaCore.get<string>("system.status");
    const modules = this.core.listModules();
    if (status !== "BOOTED") {
      throw new Error("AETERNUM_CORE_BOOT_NOT_CONFIRMED");
    }

    const moduleStateCount = modules.reduce((count, module) => {
      const observed = aeternumHortaCore.get<string>(`module.${module.id}.state`);
      return count + (observed === module.state ? 1 : 0);
    }, 0);

    if (moduleStateCount !== modules.length) {
      throw new Error("AETERNUM_MODULE_STATE_NOT_CONFIRMED");
    }

    this.snapshot = {
      ...this.snapshot,
      phase: "MODULES",
      progress: modules.length === 0 ? 0 : 1,
      evidence: {
        coreBooted: true,
        moduleStateCount,
        moduleCount: modules.length,
      },
    };
    void aeternumBus.emit("system.boot.phase", { ...this.snapshot, evidence: { ...this.snapshot.evidence } });

    this.snapshot = {
      ...this.snapshot,
      phase: "READY",
      progress: 1,
      completedAt: Date.now(),
    };
    aeternumHortaCore.set("system.appOrchestrator.status", "READY");
    aeternumHortaCore.set("system.boot.snapshot", { ...this.snapshot, evidence: { ...this.snapshot.evidence } });
    // AeternumOrchestrator already emits the canonical system.boot.complete event.
    // This wrapper reports readiness without duplicating completion evidence.
    void aeternumBus.emit("system.app.ready", { ...this.snapshot, evidence: { ...this.snapshot.evidence } });
    return { ...this.snapshot, evidence: { ...this.snapshot.evidence } };
  }

  isReady(): boolean {
    return this.snapshot?.phase === "READY";
  }

  getSnapshot(): BootSnapshot | null {
    return this.snapshot ? { ...this.snapshot, evidence: { ...this.snapshot.evidence } } : null;
  }
}

export const appOrchestrator = new AppOrchestrator();
