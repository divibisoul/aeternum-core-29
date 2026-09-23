import { AeternumOrchestrator } from "../AeternumOrchestrator";
import { aeternumBus } from "../EventBus";
import { aeternumHortaCore } from "../HortaCore";

export type BootPhase = "CORE" | "MODULES" | "SYNC" | "READY";
export interface BootSnapshot { phase: BootPhase; progress: number; startedAt: number; completedAt?: number; }

export class AppOrchestrator {
  readonly id = "app-orchestrator";
  private readonly core: AeternumOrchestrator;
  private snapshot: BootSnapshot | null = null;

  constructor(core = new AeternumOrchestrator()) { this.core = core; }

  boot(): BootSnapshot {
    if (this.snapshot?.phase === "READY") return { ...this.snapshot };
    const startedAt = Date.now();
    this.snapshot = { phase: "CORE", progress: 0.1, startedAt };
    void aeternumBus.emit("system.boot.phase", this.snapshot);
    this.core.boot();

    this.snapshot = { ...this.snapshot, phase: "MODULES", progress: 0.5 };
    void aeternumBus.emit("system.boot.phase", this.snapshot);
    this.snapshot = { ...this.snapshot, phase: "SYNC", progress: 0.8 };
    void aeternumBus.emit("system.boot.phase", this.snapshot);

    this.snapshot = { ...this.snapshot, phase: "READY", progress: 1, completedAt: Date.now() };
    aeternumHortaCore.set("system.status", "READY");
    aeternumHortaCore.set("system.boot.snapshot", this.snapshot);
    void aeternumBus.emit("system.boot.complete", { ...this.snapshot });
    return { ...this.snapshot };
  }

  isReady(): boolean { return this.snapshot?.phase === "READY"; }
  getSnapshot(): BootSnapshot | null { return this.snapshot ? { ...this.snapshot } : null; }
}

export const appOrchestrator = new AppOrchestrator();
