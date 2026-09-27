import { aeternumBus } from "../EventBus";
import { aeternumHortaCore } from "../HortaCore";

export type RefactorRequest = {
  target: string;
  strategy?: string;
};

export type RefactorResult = {
  status: "completed" | "handler_not_bound";
  target: string;
  artifact?: unknown;
  evidence?: unknown;
  execution: "real" | "not_claimed";
};

export type RefactorExecutor = (request: RefactorRequest) => Promise<Omit<RefactorResult, "status" | "execution">>;

export class SCRERefactorModule {
  readonly id = "M7.scre-refactor";
  private active = false;

  constructor(private readonly executor?: RefactorExecutor) {
    this.active = aeternumHortaCore.get<boolean>(`${this.id}.active`) ?? false;
    void aeternumBus.emit("evolution.network.capability.advertised", {
      module: this.id,
      owner: "N01",
      authority: "M7/N07_SARA governance",
      capabilities: ["refactoring", "code-optimization", "cleanup"],
    });
    aeternumBus.on("evolution.scre.activate", () => this.activate());
    aeternumBus.on("evolution.scre.deactivate", () => this.deactivate());
    aeternumBus.on("evolution.scre.refactor", (data) => {
      void this.refactor(data as RefactorRequest);
    });
  }

  activate(): void {
    this.active = true;
    aeternumHortaCore.set(`${this.id}.active`, true);
  }

  deactivate(): void {
    this.active = false;
    aeternumHortaCore.set(`${this.id}.active`, false);
  }

  async refactor(request: RefactorRequest): Promise<RefactorResult> {
    if (!this.active) {
      return { status: "handler_not_bound", target: request.target, execution: "not_claimed" };
    }
    if (!this.executor) {
      await aeternumBus.emit("evolution.scre.unbound", { request });
      return { status: "handler_not_bound", target: request.target, execution: "not_claimed" };
    }
    try {
      const produced = await this.executor(request);
      const result: RefactorResult = {
        status: "completed",
        target: request.target,
        artifact: produced.artifact,
        evidence: produced.evidence,
        execution: "real",
      };
      aeternumHortaCore.set(`${this.id}.last`, result);
      await aeternumBus.emit("evolution.scre.refactored", result);
      return result;
    } catch (error) {
      await aeternumBus.emit("evolution.scre.error", {
        target: request.target,
        error: error instanceof Error ? error.message : String(error),
      });
      return { status: "handler_not_bound", target: request.target, execution: "not_claimed" };
    }
  }
}

export const screRefactorModule = new SCRERefactorModule();
