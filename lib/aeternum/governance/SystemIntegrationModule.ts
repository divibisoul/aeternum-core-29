import { aeternumBus } from "../EventBus";
import { aeternumHortaCore } from "../HortaCore";

export type IntegrationRegistration = {
  name: string;
  endpoint?: string;
  type: string;
  verifier?: () => Promise<unknown>;
};

export type IntegrationState = IntegrationRegistration & {
  registeredAt: number;
  status: "registered" | "verified" | "verification_failed";
  evidence?: unknown;
};

export class SystemIntegrationModule {
  readonly id = "M2.system-integration";
  private active = false;
  private readonly integrations = new Map<string, IntegrationState>();

  constructor() {
    this.active = aeternumHortaCore.get<boolean>(`${this.id}.active`) ?? false;
    aeternumBus.on("governance.integration.activate", () => this.activate());
    aeternumBus.on("governance.integration.deactivate", () => this.deactivate());
    aeternumBus.on("governance.integration.register", (data) => {
      void this.registerIntegration(data as IntegrationRegistration);
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

  async registerIntegration(data: IntegrationRegistration): Promise<IntegrationState> {
    const state: IntegrationState = {
      ...data,
      registeredAt: Date.now(),
      status: "registered",
    };

    if (data.verifier) {
      try {
        state.evidence = await data.verifier();
        state.status = "verified";
      } catch (error) {
        state.status = "verification_failed";
        state.evidence = error instanceof Error ? error.message : String(error);
      }
    }

    this.integrations.set(data.name, state);
    aeternumHortaCore.set(`${this.id}.${data.name}`, state);
    await aeternumBus.emit("governance.integration.registered", state);
    return state;
  }

  getIntegrations(): IntegrationState[] {
    return [...this.integrations.values()].map((item) => ({ ...item }));
  }
}

export const systemIntegrationModule = new SystemIntegrationModule();
