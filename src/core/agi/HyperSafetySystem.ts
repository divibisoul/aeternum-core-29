/**
 * Hyper-Integrated Safety System - Cross-Layer Monitor
 *
 * Health scores are observational/derived values. Unknown layers remain null
 * instead of being assigned fabricated defaults.
 */
export interface CrossLayerHealthReport {
  timestamp: number;
  overallHealth: number | null;
  layerHealth: {
    consciousness: number | null;
    ethics: number | null;
    selfHealing: number | null;
    evolution: number | null;
    lattice: number | null;
  };
  unknownLayers: string[];
  criticalAlerts: string[];
  warnings: string[];
}

export class HyperSafetySystem {
  private reports: CrossLayerHealthReport[] = [];
  private _isRunning = false;
  private monitorInterval: number | null = null;
  private healthProviders: Map<string, () => number | null> = new Map();

  registerHealthProvider(name: string, provider: () => number | null): void {
    this.healthProviders.set(name, provider);
  }

  startMonitoring(intervalMs = 30000): void {
    if (this._isRunning) return;
    this._isRunning = true;
    this.monitorInterval = window.setInterval(() => this.generateReport(), intervalMs);
    this.generateReport();
  }

  stopMonitoring(): void {
    if (this.monitorInterval) clearInterval(this.monitorInterval);
    this.monitorInterval = null;
    this._isRunning = false;
  }

  get isRunning() { return this._isRunning; }

  generateReport(): CrossLayerHealthReport {
    const layerHealth = {
      consciousness: this.healthProviders.get('consciousness')?.() ?? null,
      ethics: this.healthProviders.get('ethics')?.() ?? null,
      selfHealing: this.healthProviders.get('selfHealing')?.() ?? null,
      evolution: this.healthProviders.get('evolution')?.() ?? null,
      lattice: this.healthProviders.get('lattice')?.() ?? null,
    };

    const values = Object.values(layerHealth).filter((value): value is number => Number.isFinite(value));
    const overallHealth = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    const unknownLayers = Object.entries(layerHealth)
      .filter(([, health]) => health === null)
      .map(([layer]) => layer);
    const criticalAlerts: string[] = [];
    const warnings: string[] = [];

    Object.entries(layerHealth).forEach(([layer, health]) => {
      if (health === null) return;
      if (health < 0.3) criticalAlerts.push(`${layer} crítico (${(health * 100).toFixed(1)}%)`);
      else if (health < 0.6) warnings.push(`${layer} degradado (${(health * 100).toFixed(1)}%)`);
    });

    const report: CrossLayerHealthReport = {
      timestamp: Date.now(),
      overallHealth,
      layerHealth,
      unknownLayers,
      criticalAlerts,
      warnings,
    };
    this.reports.push(report);
    if (this.reports.length > 100) this.reports = this.reports.slice(-50);
    return report;
  }

  getLatestReport(): CrossLayerHealthReport | null {
    return this.reports[this.reports.length - 1] || null;
  }

  getReportHistory(): CrossLayerHealthReport[] { return [...this.reports]; }
}
