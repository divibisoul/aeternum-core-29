import { aeternumBus, AeternumEventBus } from "../EventBus";
import { aeternumHortaCore, AeternumHortaCore } from "../HortaCore";

export type OperationObservation = {
  id: string;
  type: string;
  status: "running" | "completed" | "failed";
  progress?: number;
  totalSteps?: number;
  message?: string;
  startedAt?: number;
  updatedAt?: number;
  completedAt?: number;
  metadata?: Record<string, unknown>;
};

export class ActiveOperationsMonitorModule {
  readonly id = "L5.ActiveOperationsMonitorModule";
  private active = false;
  private readonly operations = new Map<string, OperationObservation>();
  private readonly history: OperationObservation[] = [];

  constructor(
    private readonly bus: AeternumEventBus = aeternumBus,
    private readonly state: AeternumHortaCore = aeternumHortaCore,
  ) {
    this.active = state.get<boolean>(`${this.id}.active`) ?? false;
    bus.on("monitor.operations.activate", () => this.activate());
    bus.on("monitor.operations.deactivate", () => this.deactivate());
    bus.on("operations.start", (data: OperationObservation) => this.start(data));
    bus.on("operations.update", (data: Partial<OperationObservation> & { id: string }) => this.update(data));
    bus.on("operations.complete", (data: { id: string; metadata?: Record<string, unknown> }) => this.complete(data));
    bus.on("operations.fail", (data: { id: string; message?: string; metadata?: Record<string, unknown> }) => this.fail(data));
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

  start(observation: OperationObservation): boolean {
    if (!this.active || !observation.id.trim() || !observation.type.trim()) return false;
    if (this.operations.has(observation.id)) {
      void this.bus.emit("monitor.operations.invalid", {
        module: this.id,
        reason: "DUPLICATE_OPERATION_ID",
        id: observation.id,
      });
      return false;
    }

    const operation: OperationObservation = {
      ...observation,
      status: "running",
      updatedAt: observation.updatedAt ?? Date.now(),
      startedAt: observation.startedAt ?? Date.now(),
    };

    this.operations.set(operation.id, operation);
    this.publish();
    return true;
  }

  update(observation: Partial<OperationObservation> & { id: string }): boolean {
    const current = this.operations.get(observation.id);
    if (!this.active || !current) return false;

    const progress = observation.progress;
    if (progress !== undefined && !Number.isFinite(progress)) return false;
    const totalSteps = observation.totalSteps;
    if (totalSteps !== undefined && (!Number.isFinite(totalSteps) || totalSteps < 0)) return false;

    const next: OperationObservation = {
      ...current,
      ...observation,
      status: "running",
      updatedAt: observation.updatedAt ?? Date.now(),
    };

    this.operations.set(next.id, next);
    this.publish();
    return true;
  }

  complete(data: { id: string; metadata?: Record<string, unknown> }): boolean {
    const current = this.operations.get(data.id);
    if (!this.active || !current) return false;

    const completed: OperationObservation = {
      ...current,
      status: "completed",
      progress: current.totalSteps && current.totalSteps > 0 ? current.totalSteps : current.progress,
      completedAt: Date.now(),
      updatedAt: Date.now(),
      metadata: { ...current.metadata, ...data.metadata },
    };

    this.operations.delete(data.id);
    this.history.push(completed);
    this.trimHistory();
    this.publish();
    return true;
  }

  fail(data: { id: string; message?: string; metadata?: Record<string, unknown> }): boolean {
    const current = this.operations.get(data.id);
    if (!this.active || !current) return false;

    const failed: OperationObservation = {
      ...current,
      status: "failed",
      message: data.message ?? current.message,
      completedAt: Date.now(),
      updatedAt: Date.now(),
      metadata: { ...current.metadata, ...data.metadata },
    };

    this.operations.delete(data.id);
    this.history.push(failed);
    this.trimHistory();
    this.publish();
    return true;
  }

  getActiveOperations(): OperationObservation[] {
    return [...this.operations.values()].map((operation) => ({ ...operation }));
  }

  getHistory(): OperationObservation[] {
    return this.history.map((operation) => ({ ...operation }));
  }

  private trimHistory(): void {
    if (this.history.length > 200) this.history.splice(0, this.history.length - 200);
  }

  private publish(): void {
    const active = this.getActiveOperations();
    this.state.set("operations.active", active);
    void this.bus.emit("operations.updated", active);
  }
}

export const activeOperationsMonitorModule = new ActiveOperationsMonitorModule();
