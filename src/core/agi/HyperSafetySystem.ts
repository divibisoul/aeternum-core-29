/**
 * Hyper-Integrated Safety System - Cross-Layer Monitor
 */

export interface CrossLayerHealthReport {
  timestamp: number;
  overallHealth: number;
  layerHealth: {
    consciousness: number;
    ethics: number;
    selfHealing: number;
    evolution: number;
    lattice: number;
  };
  unmeasuredLayers: string[];
  criticalAlerts: string[];
  warnings: string[];
}

export class HyperSafetySystem {
  private reports: CrossLayerHealthReport[] = [];
  private _isRunning = false;
  private monitorInterval: number | null = null;
  private healthProviders: Map<string, () => number> = new Map();

  registerHealthProvider(name: string, provider: () => number): void {
    this.healthProviders.set(name, provider);
  }

  startMonitoring(intervalMs = 30000): void {
    if (this._isRunning) return;
    this._isRunning = true;
    this.monitorInterval = window.setInterval(() => this.generateReport(), intervalMs);
    this.generateReport(); // Initial report
  }

  stopMonitoring(): void {
    if (this.monitorInterval) clearInterval(this.monitorInterval);
    this.monitorInterval = null;
    this._isRunning = false;
  }

  get isRunning() { return this._isRunning; }

  generateReport(): CrossLayerHealthReport {
    const names = ['consciousness', 'ethics', 'selfHealing', 'evolution', 'lattice'] as const;
    const unmeasuredLayers = names.filter(name => !this.healthProviders.has(name));
    const layerHealth = {
      consciousness: this.healthProviders.get('consciousness')?.() ?? 0,
      ethics: this.healthProviders.get('ethics')?.() ?? 0,
      selfHealing: this.healthProviders.get('selfHealing')?.() ?? 0,
      evolution: this.healthProviders.get('evolution')?.() ?? 0,
      lattice: this.healthProviders.get('lattice')?.() ?? 0,
    };

    const values = Object.values(layerHealth);
    const overallHealth = values.reduce((s, v) => s + v, 0) / values.length;

    const criticalAlerts: string[] = [];
    const warnings: string[] = [];

    Object.entries(layerHealth).forEach(([layer, health]) => {
      if (health < 0.3) criticalAlerts.push(`${layer} crítico (${(health * 100).toFixed(1)}%)`);
      else if (health < 0.6) warnings.push(`${layer} degradado (${(health * 100).toFixed(1)}%)`);
    });

    const report: CrossLayerHealthReport = {
      timestamp: Date.now(),
      overallHealth,
      layerHealth,
      unmeasuredLayers,
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
