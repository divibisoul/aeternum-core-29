import { aeternumBus, AeternumEventBus } from "../EventBus";
import { aeternumHortaCore, AeternumHortaCore } from "../HortaCore";
import { aeternumWormhole, AeternumWormholeRegistry } from "../WormholeRegistry";

export type VagusEnvelope = {
  event: string;
  data: unknown;
  timestamp: number;
  sequence?: number;
  source?: string;
};

export class VagusNerveServiceModule {
  readonly id = "M8.vagus-nerve-service";
  private active = false;

  constructor(
    private readonly bus: AeternumEventBus = aeternumBus,
    private readonly state: AeternumHortaCore = aeternumHortaCore,
    private readonly registry: AeternumWormholeRegistry = aeternumWormhole,
  ) {
    this.active = state.get<boolean>(`${this.id}.active`) ?? false;
    registry.register(
      {
        id: "M8_GOVERNANCE_MEMORY",
        name: "Governança e Memória",
        owner: "N01",
        state: "adapter",
        capabilities: ["vagus-service", "event-publication", "event-subscription"],
        dependencies: ["M1_CORE"],
        evidence: ["lib/aeternum/governance/VagusNerveServiceModule.ts"],
      },
      this,
    );

    bus.on("governance.vagus.activate", () => this.activate());
    bus.on("governance.vagus.deactivate", () => this.deactivate());
    bus.on("governance.vagus.publish", (data: unknown) => {
      const envelope = data as VagusEnvelope;
      if (envelope?.event) void this.publish(envelope.event, envelope.data);
    });
  }

  activate(): void {
    this.active = true;
    this.state.set(`${this.id}.active`, true);
    void this.bus.emit("governance.vagus.activated", { module: this.id });
  }

  deactivate(): void {
    this.active = false;
    this.state.set(`${this.id}.active`, false);
    void this.bus.emit("governance.vagus.deactivated", { module: this.id });
  }

  isActive(): boolean {
    return this.active;
  }

  async publish(event: string, data: unknown = undefined): Promise<number> {
    if (!this.active) {
      await this.bus.emit("governance.vagus.unbound", {
        event,
        reason: "service_inactive",
      });
      return 0;
    }

    const listeners = await this.bus.emit(event, data);
    this.state.set("governance.vagus.last", {
      event,
      timestamp: Date.now(),
      listeners,
    });
    return listeners;
  }

  subscribe<T>(event: string, listener: (data: T) => void | Promise<void>): () => void {
    return this.bus.on(event, listener);
  }

  history(limit = 100): VagusEnvelope[] {
    return this.bus
      .getHistory()
      .slice(-Math.max(0, limit))
      .map((entry) => ({
        event: entry.event,
        data: entry.data,
        timestamp: entry.timestamp,
        sequence: entry.sequence,
      }));
  }
}

export const vagusNerveServiceModule = new VagusNerveServiceModule();
