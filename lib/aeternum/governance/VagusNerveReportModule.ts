import { aeternumBus, AeternumEventBus } from "../EventBus";
import { aeternumHortaCore, AeternumHortaCore } from "../HortaCore";
import { aeternumWormhole, AeternumWormholeRegistry } from "../WormholeRegistry";

export type VagusTrafficReport = {
  id: string;
  totalEvents: number;
  eventsPerMinute: number;
  averageInterEventGapMs: number | null;
  topEvents: Array<{ event: string; count: number }>;
  recentEvents: Array<{ event: string; timestamp: number; sequence: number }>;
  health: "HEALTHY" | "BUSY" | "DEGRADED" | "UNASSESSED";
  healthBasis: string;
  timestamp: number;
};

export class VagusNerveReportModule {
  readonly id = "M8.vagus-nerve-report";
  private active = false;

  constructor(
    private readonly bus: AeternumEventBus = aeternumBus,
    private readonly state: AeternumHortaCore = aeternumHortaCore,
    registry: AeternumWormholeRegistry = aeternumWormhole,
  ) {
    this.active = state.get<boolean>(`${this.id}.active`) ?? false;
    registry.register(
      {
        id: "M8_GOVERNANCE_MEMORY",
        name: "Governança e Memória",
        owner: "N01",
        state: "adapter",
        capabilities: ["neural-monitoring", "traffic-analysis", "health-report"],
        dependencies: ["M1_CORE"],
        evidence: ["lib/aeternum/governance/VagusNerveReportModule.ts"],
      },
      this,
    );
    bus.on("governance.vagus.report.activate", () => this.activate());
    bus.on("governance.vagus.report.deactivate", () => this.deactivate());
    bus.on("governance.vagus.report.generate", () => {
      void this.generateReport();
    });
  }

  activate(): void {
    this.active = true;
    this.state.set(`${this.id}.active`, true);
    this.state.set(`${this.id}.activatedAt`, Date.now());
    void this.bus.emit("module.activated", { module: this.id });
  }

  deactivate(): void {
    this.active = false;
    this.state.set(`${this.id}.active`, false);
    void this.bus.emit("module.deactivated", { module: this.id });
  }

  async generateReport(): Promise<VagusTrafficReport | null> {
    if (!this.active) {
      await this.bus.emit("governance.vagus.report.unbound", {
        reason: "monitor_inactive",
      });
      return null;
    }

    const history = this.bus.getHistory();
    const now = Date.now();
    const recent = history.filter((entry) => now - entry.timestamp < 60_000);

    const gaps: number[] = [];
    for (let index = 1; index < history.length; index += 1) {
      const gap = history[index].timestamp - history[index - 1].timestamp;
      if (gap >= 0) gaps.push(gap);
    }

    const counts = new Map<string, number>();
    for (const entry of history) {
      counts.set(entry.event, (counts.get(entry.event) ?? 0) + 1);
    }

    const averageInterEventGapMs = gaps.length
      ? gaps.reduce((sum, value) => sum + value, 0) / gaps.length
      : null;

    const health = this.classifyHealth(recent.length);

    const report: VagusTrafficReport = {
      id: `vagus-report-${Date.now()}`,
      totalEvents: history.length,
      eventsPerMinute: recent.length,
      averageInterEventGapMs,
      topEvents: [...counts.entries()]
        .map(([event, count]) => ({ event, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      recentEvents: history.slice(-10).map((entry) => ({
        event: entry.event,
        timestamp: entry.timestamp,
        sequence: entry.sequence,
      })),
      health,
      healthBasis:
        "Classificação baseada somente no volume observado no EventBus; latência de processamento de listeners não é inferida.",
      timestamp: now,
    };

    this.state.set("governance.vagus.lastReport", report);
    await this.bus.emit("governance.vagus.report.generated", report);
    return report;
  }

  private classifyHealth(eventsPerMinute: number): VagusTrafficReport["health"] {
    if (eventsPerMinute === 0) return "UNASSESSED";
    if (eventsPerMinute > 500) return "DEGRADED";
    if (eventsPerMinute > 100) return "BUSY";
    return "HEALTHY";
  }
}

export const vagusNerveReportModule = new VagusNerveReportModule();
