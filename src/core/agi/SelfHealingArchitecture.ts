/**
 * Self-Healing Architecture - Auto-Correção e Reconstrução
 */

import { SafeSelfImprovementCore } from './SafeSelfImprovementCore';

export interface SystemHealth {
  overallScore: number;
  moduleScores: Record<string, number>;
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  lastScanTimestamp: number;
}

export interface ModuleHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'failed' | 'recovering';
  performance: number;
  memoryUsage: number;
  errorRate: number;
  uptime: number;
}

export type ModuleHealthProvider = () => {
  performance: number;
  memoryUsage: number;
  errorRate: number;
  healthy: boolean;
};

export class IntegrityScanner {
  private scanHistory: SystemHealth[] = [];
  private moduleRegistry: Map<string, ModuleHealth> = new Map();
  private providers: Map<string, ModuleHealthProvider> = new Map();

  registerModule(name: string, provider: ModuleHealthProvider): void {
    this.providers.set(name, provider);
    this.moduleRegistry.set(name, {
      name,
      status: 'degraded',
      performance: 0,
      memoryUsage: 0,
      errorRate: 0,
      uptime: Date.now(),
    });
  }

  async scanAllModules(): Promise<SystemHealth> {
    const moduleScores: Record<string, number> = {};
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let totalScore = 0, count = 0;

    for (const [name, health] of this.moduleRegistry) {
      const provider = this.providers.get(name);
      if (!provider) {
        warnings.push(name + ': fornecedor de saúde ausente');
        continue;
      }
      try {
        const observed = provider();
        health.performance = Math.max(0, Math.min(1, observed.performance));
        health.memoryUsage = Math.max(0, Math.min(1, observed.memoryUsage));
        health.errorRate = Math.max(0, Math.min(1, observed.errorRate));
        health.status = !observed.healthy ? 'failed' : health.performance < 0.5 ? 'degraded' : 'healthy';
      } catch (error) {
        health.status = 'failed';
        health.errorRate = 1;
        criticalIssues.push(name + ' - health provider failed: ' + String(error));
      }

      const score = health.performance * 0.5 + (1 - health.errorRate) * 0.3 + (1 - health.memoryUsage) * 0.2;
      moduleScores[name] = score;
      totalScore += score;
      count++;

      if (score < 0.5) criticalIssues.push(`${name} crítico (${(score * 100).toFixed(1)}%)`);
      else if (score < 0.7) warnings.push(`${name} degradado (${(score * 100).toFixed(1)}%)`);
      if (health.errorRate > 0.05) recommendations.push(`Reinicializar ${name}`);
    }

    const overallScore = count > 0 ? totalScore / count : 0;
    if (count === 0) criticalIssues.push('NO_OBSERVED_HEALTH_PROVIDERS');
    const result: SystemHealth = {
      overallScore, moduleScores, criticalIssues,
      warnings, recommendations, lastScanTimestamp: Date.now()
    };
    this.scanHistory.push(result);
    if (this.scanHistory.length > 100) this.scanHistory = this.scanHistory.slice(-50);
    return result;
  }

  getAllModules(): ModuleHealth[] { return Array.from(this.moduleRegistry.values()); }
  getScanHistory(): SystemHealth[] { return [...this.scanHistory]; }
}

export type RebuildHandler = (moduleName: string) => Promise<{ version: string; performance: number }> | { version: string; performance: number };

export class ReconstructionEngine {
  private history: Array<{ timestamp: number; moduleName: string; success: boolean; evidence: string }> = [];
  private handlers: Map<string, RebuildHandler> = new Map();

  registerHandler(moduleName: string, handler: RebuildHandler): void {
    this.handlers.set(moduleName, handler);
  }

  async rebuildModule(moduleName: string): Promise<any> {
    const handler = this.handlers.get(moduleName);
    if (!handler) {
      this.history.push({ timestamp: Date.now(), moduleName, success: false, evidence: 'EXECUTION_REQUIRED' });
      return { name: moduleName, version: null, performance: null, status: 'EXECUTION_REQUIRED' };
    }
    try {
      const result = await handler(moduleName);
      this.history.push({ timestamp: Date.now(), moduleName, success: true, evidence: 'OBSERVED_HANDLER_RESULT' });
      return { name: moduleName, ...result, status: 'healthy' };
    } catch (error) {
      this.history.push({ timestamp: Date.now(), moduleName, success: false, evidence: 'HANDLER_FAILED' });
      return { name: moduleName, version: null, performance: null, status: 'BLOCKED_EXTERNAL', error: String(error) };
    }
  }

  getHistory() { return [...this.history]; }
}

export class SelfHealingArchitecture {
  public safe_core: SafeSelfImprovementCore;
  public integrity_scanner: IntegrityScanner;
  public reconstruction_engine: ReconstructionEngine;
  private diagnosticInterval: number | null = null;
  private _isRunning = false;

  constructor(safeCore: SafeSelfImprovementCore) {
    this.safe_core = safeCore;
    this.integrity_scanner = new IntegrityScanner();
    this.reconstruction_engine = new ReconstructionEngine();
  }

  get isRunning() { return this._isRunning; }

  startContinuousDiagnosis(intervalMs = 60000): void {
    if (this._isRunning) return;
    this._isRunning = true;
    this.diagnosticInterval = window.setInterval(() => this.performDiagnosticCycle(), intervalMs);
  }

  stopContinuousDiagnosis(): void {
    if (this.diagnosticInterval) clearInterval(this.diagnosticInterval);
    this.diagnosticInterval = null;
    this._isRunning = false;
  }

  async performDiagnosticCycle(): Promise<SystemHealth> {
    const health = await this.integrity_scanner.scanAllModules();
    if (health.criticalIssues.length > 0) {
      for (const module of Object.entries(health.moduleScores).filter(([, s]) => s < 0.5).map(([n]) => n)) {
        await this.reconstruction_engine.rebuildModule(module);
      }
    }
    return health;
  }

  getLatestHealth(): SystemHealth | null {
    const history = this.integrity_scanner.getScanHistory();
    return history[history.length - 1] || null;
  }
}
