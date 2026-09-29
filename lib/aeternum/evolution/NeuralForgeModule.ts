import { aeternumBus, AeternumEventBus } from "../EventBus";
import { aeternumHortaCore, AeternumHortaCore } from "../HortaCore";

/**
 * M7/Evolution adapter hosted in N01.
 *
 * N07/SARA remains the governance/regeneration authority. This module only
 * exposes the forge contract at the N01 network boundary and never fabricates
 * generated code or validation results.
 */
export interface ForgeRequest {
  name: string;
  purpose: string;
  template?: string;
}

export interface ForgeResult {
  status: "completed" | "handler_not_bound";
  capabilityId?: string;
  artifact?: unknown;
  validation?: unknown;
  execution: "real" | "not_claimed";
}

export type ForgeExecutor = (
  request: ForgeRequest,
) => Promise<Omit<ForgeResult, "status" | "execution">>;

export class NeuralForgeModule {
  readonly id = "M7.neural-forge";
  private active = false;
  private readonly capabilities = new Map<string, ForgeResult>();

  constructor(
    private readonly executor?: ForgeExecutor,
    private readonly bus: AeternumEventBus = aeternumBus,
    private readonly state: AeternumHortaCore = aeternumHortaCore,
  ) {
    this.active = state.get<boolean>(`${this.id}.active`) ?? false;
    bus.on("evolution.forge.activate", () => this.activate());
    bus.on("evolution.forge.deactivate", () => this.deactivate());
    bus.on("evolution.forge.create", (data: unknown) => {
      void this.forge(data as ForgeRequest);
    });
  }

  activate(): void {
    this.active = true;
    this.state.set(`${this.id}.active`, true);
    void this.bus.emit("evolution.module.activated", { module: this.id });
  }

  deactivate(): void {
    this.active = false;
    this.state.set(`${this.id}.active`, false);
    void this.bus.emit("evolution.module.deactivated", { module: this.id });
  }

  async forge(request: ForgeRequest): Promise<ForgeResult> {
    if (!this.active) {
      return { status: "handler_not_bound", execution: "not_claimed" };
    }

    if (!this.executor) {
      const result: ForgeResult = { status: "handler_not_bound", execution: "not_claimed" };
      await this.bus.emit("evolution.forge.unbound", { request, result });
      return result;
    }

    try {
      await this.bus.emit("evolution.forge.progress", { stage: "delegating", progress: null, name: request.name });
      const produced = await this.executor(request);
      const result: ForgeResult = {
        status: "completed",
        capabilityId: produced.capabilityId,
        artifact: produced.artifact,
        validation: produced.validation,
        execution: "real",
      };
      if (produced.capabilityId) this.capabilities.set(produced.capabilityId, result);
      this.state.set(`${this.id}.last`, result);
      await this.bus.emit("evolution.forge.created", result);
      return result;
    } catch (error) {
      const result: ForgeResult = {
        status: "handler_not_bound",
        execution: "not_claimed",
      };
      await this.bus.emit("evolution.forge.error", {
        request,
        error: error instanceof Error ? error.message : String(error),
      });
      return result;
    }
  }

  listForged(): Array<[string, ForgeResult]> {
    return [...this.capabilities.entries()];
  }
}

export const neuralForgeModule = new NeuralForgeModule();
