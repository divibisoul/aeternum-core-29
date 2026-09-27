import { aeternumBus } from "../EventBus";
import { aeternumHortaCore } from "../HortaCore";

export type MemoryWriteRequest = {
  state: Record<string, unknown>;
  label?: string;
};

export type MemoryReadRequest = {
  versionId?: number;
};

export type MemoryExecutor = {
  store?(request: MemoryWriteRequest): Promise<unknown>;
  latest?(): Promise<unknown> | unknown;
  get?(request: MemoryReadRequest): Promise<unknown> | unknown;
  trail?(): Promise<unknown> | unknown;
};

export class MemoryModule {
  readonly id = "M8.memory";
  private active = false;

  constructor(private readonly executor?: MemoryExecutor) {
    this.active = aeternumHortaCore.get<boolean>(`${this.id}.active`) ?? false;

    aeternumBus.on("governance.memory.activate", () => this.activate());
    aeternumBus.on("governance.memory.deactivate", () => this.deactivate());
    aeternumBus.on("governance.memory.store", (data) => {
      void this.store(data as MemoryWriteRequest);
    });
    aeternumBus.on("governance.memory.recall", (data) => {
      void this.recall(data as MemoryReadRequest);
    });
  }

  activate(): void {
    this.active = true;
    aeternumHortaCore.set(`${this.id}.active`, true);
    void aeternumBus.emit("module.activated", { module: this.id });
  }

  deactivate(): void {
    this.active = false;
    aeternumHortaCore.set(`${this.id}.active`, false);
    void aeternumBus.emit("module.deactivated", { module: this.id });
  }

  async store(request: MemoryWriteRequest): Promise<unknown> {
    if (!this.active || !this.executor?.store) {
      const result = { status: "adapter_unbound", execution: "not_claimed" as const };
      await aeternumBus.emit("governance.memory.unbound", result);
      return result;
    }

    const result = await this.executor.store({
      state: { ...request.state },
      label: request.label,
    });

    aeternumHortaCore.set(`${this.id}.lastStore`, result);
    await aeternumBus.emit("governance.memory.stored", result);
    return { status: "completed", execution: "real", result };
  }

  async recall(request: MemoryReadRequest = {}): Promise<unknown> {
    if (!this.active || !this.executor) {
      const result = { status: "adapter_unbound", execution: "not_claimed" as const };
      await aeternumBus.emit("governance.memory.unbound", result);
      return result;
    }

    const result = request.versionId !== undefined
      ? await this.executor.get?.(request)
      : await this.executor.latest?.();

    await aeternumBus.emit("governance.memory.recalled", {
      request,
      result,
      execution: "real",
    });
    return { status: "completed", execution: "real", result };
  }

  async trail(): Promise<unknown> {
    if (!this.active || !this.executor?.trail) {
      return { status: "adapter_unbound", execution: "not_claimed" };
    }
    return { status: "completed", execution: "real", result: await this.executor.trail() };
  }
}

export const memoryModule = new MemoryModule();
