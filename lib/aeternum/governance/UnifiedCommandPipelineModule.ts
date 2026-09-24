import { aeternumBus, AeternumEventBus } from "../EventBus";
import { aeternumHortaCore, AeternumHortaCore } from "../HortaCore";

export type UnifiedCommand = {
  prompt: string;
  context?: Record<string, unknown>;
};

export type UnifiedCommandResult = {
  status: "completed" | "executor_unbound";
  commandId: string;
  execution: "real" | "not_claimed";
  result?: unknown;
};

export type UnifiedCommandExecutor = (
  command: UnifiedCommand & { commandId: string },
) => Promise<unknown>;

export class UnifiedCommandPipelineModule {
  readonly id = "M2.unified-command-pipeline";
  private active = false;

  constructor(
    private readonly executor?: UnifiedCommandExecutor,
    private readonly bus: AeternumEventBus = aeternumBus,
    private readonly state: AeternumHortaCore = aeternumHortaCore,
  ) {
    this.active = state.get<boolean>(`${this.id}.active`) ?? false;
    bus.on("governance.command.activate", () => this.activate());
    bus.on("governance.command.deactivate", () => this.deactivate());
    bus.on("governance.command.process", (data) => {
      void this.processCommand(data as UnifiedCommand);
    });
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

  async processCommand(command: UnifiedCommand): Promise<UnifiedCommandResult> {
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!this.active || !this.executor) {
      const result: UnifiedCommandResult = {
        status: "executor_unbound",
        commandId,
        execution: "not_claimed",
      };
      await this.bus.emit("governance.command.unbound", result);
      return result;
    }

    try {
      await this.bus.emit("governance.command.stage", {
        commandId,
        stage: "dispatch",
        progress: null,
      });
      const output = await this.executor({ ...command, commandId });
      const result: UnifiedCommandResult = {
        status: "completed",
        commandId,
        execution: "real",
        result: output,
      };
      this.state.set(`${this.id}.last`, result);
      await this.bus.emit("governance.command.complete", result);
      return result;
    } catch (error) {
      const result: UnifiedCommandResult = {
        status: "executor_unbound",
        commandId,
        execution: "not_claimed",
      };
      await this.bus.emit("governance.command.error", {
        commandId,
        error: error instanceof Error ? error.message : String(error),
      });
      return result;
    }
  }
}

export const unifiedCommandPipelineModule = new UnifiedCommandPipelineModule();
