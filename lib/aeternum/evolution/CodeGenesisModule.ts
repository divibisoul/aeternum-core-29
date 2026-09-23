import { aeternumBus } from "../EventBus";
import { aeternumHortaCore } from "../HortaCore";

export type CodeGenerationRequest = {
  spec: string;
  language?: string;
};

export type CodeGenerationResult = {
  status: "completed" | "handler_not_bound";
  artifact?: unknown;
  evidence?: unknown;
  execution: "real" | "not_claimed";
};

export type CodeGeneratorExecutor = (request: CodeGenerationRequest) => Promise<Omit<CodeGenerationResult, "status" | "execution">>;

export class CodeGenesisModule {
  readonly id = "M7.code-genesis";
  private active = false;
  private readonly generated: CodeGenerationResult[] = [];

  constructor(private readonly executor?: CodeGeneratorExecutor) {
    this.active = aeternumHortaCore.get<boolean>(`${this.id}.active`) ?? false;
    aeternumBus.on("evolution.genesis.activate", () => this.activate());
    aeternumBus.on("evolution.genesis.deactivate", () => this.deactivate());
    aeternumBus.on("evolution.genesis.generate", (data) => {
      void this.generate(data as CodeGenerationRequest);
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

  async generate(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    if (!this.active || !this.executor) {
      const result: CodeGenerationResult = { status: "handler_not_bound", execution: "not_claimed" };
      await aeternumBus.emit("evolution.genesis.unbound", { request, result });
      return result;
    }

    try {
      const produced = await this.executor(request);
      const result: CodeGenerationResult = {
        status: "completed",
        artifact: produced.artifact,
        evidence: produced.evidence,
        execution: "real",
      };
      this.generated.push(result);
      aeternumHortaCore.set(`${this.id}.last`, result);
      await aeternumBus.emit("evolution.genesis.generated", result);
      return result;
    } catch (error) {
      await aeternumBus.emit("evolution.genesis.error", {
        request,
        error: error instanceof Error ? error.message : String(error),
      });
      return { status: "handler_not_bound", execution: "not_claimed" };
    }
  }

  history(): CodeGenerationResult[] {
    return [...this.generated];
  }
}

export const codeGenesisModule = new CodeGenesisModule();
