import { aeternumBus, AeternumEventBus } from "../EventBus";
import { aeternumHortaCore, AeternumHortaCore } from "../HortaCore";

export type UISystemTelemetry = {
  timestamp: number;
  fps?: number;
  renderTimeMs?: number;
  memoryUsageBytes?: number;
  activeComponents?: number;
  source: string;
  evidence?: unknown;
};

export type UISystemMonitorSnapshot = UISystemTelemetry & {
  memoryUsageMb?: number;
  status: "OBSERVED" | "UNASSESSED";
};

export class UISystemsMonitorModule {
  readonly id = "L5.UISystemsMonitorModule";
  private active = false;
  private latest: UISystemMonitorSnapshot | null = null;

  constructor(
    private readonly bus: AeternumEventBus = aeternumBus,
    private readonly state: AeternumHortaCore = aeternumHortaCore,
  ) {
    this.active = state.get<boolean>(`${this.id}.active`) ?? false;
    bus.on("monitor.ui.activate", () => this.activate());
    bus.on("monitor.ui.deactivate", () => this.deactivate());
    bus.on("monitor.ui.metrics.request", () => this.publish());
    bus.on("monitor.ui.metrics.observe", (data: UISystemTelemetry) => this.observe(data));
  }

  activate(): void {
    this.active = true;
    this.state.set(`${this.id}.active`, true);
    void this.bus.emit("module.activated", { module: this.id });
  }

  deactivate(): void {
    this.active = false;
    this.state.set(`${this.id}.active`, false);
    void this.bus.emit("module.deactivated", { module: this.id });
  }

  observe(data: UISystemTelemetry): UISystemMonitorSnapshot | null {
    if (!this.active) return null;
    if (!Number.isFinite(data.timestamp) || !data.source.trim()) {
      void this.bus.emit("monitor.ui.invalid", { module: this.id, reason: "INVALID_TELEMETRY" });
      return null;
    }

    const numericFields = [data.fps, data.renderTimeMs, data.memoryUsageBytes, data.activeComponents];
    if (numericFields.some((value) => value !== undefined && !Number.isFinite(value))) {
      void this.bus.emit("monitor.ui.invalid", { module: this.id, reason: "NON_FINITE_METRIC" });
      return null;
    }

    const snapshot: UISystemMonitorSnapshot = {
      ...data,
      memoryUsageMb:
        data.memoryUsageBytes !== undefined ? data.memoryUsageBytes / 1048576 : undefined,
      status: "OBSERVED",
    };

    this.latest = Object.freeze(snapshot);
    this.state.set("monitor.ui.latest", this.latest);
    void this.bus.emit("monitor.ui.metrics", this.latest);
    return this.latest;
  }

  getMetrics(): UISystemMonitorSnapshot | null {
    return this.latest ? { ...this.latest } : null;
  }

  publish(): void {
    if (!this.latest) {
      void this.bus.emit("monitor.ui.metrics", {
        module: this.id,
        status: "UNASSESSED",
        reason: "NO_OBSERVED_TELEMETRY",
      });
      return;
    }
    void this.bus.emit("monitor.ui.metrics", this.latest);
  }
}

export const uiSystemsMonitorModule = new UISystemsMonitorModule();
