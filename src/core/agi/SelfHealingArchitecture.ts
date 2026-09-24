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

export type ModuleHealthSource = () => Pick<ModuleHealth, 'status' | 'performance' | 'memoryUsage' | 'errorRate'>;

export class IntegrityScanner {
  private scanHistory: SystemHealth[] = [];
  private moduleRegistry: Map<string, ModuleHealth> = new Map();
  private healthSources: Map<string, ModuleHealthSource> = new Map();

  constructor() {
    const modules = [
      'neural_processor', 'memory_system', 'ethics_guardian',
      'consciousness_monitor', 'godel_agent', 'recursive_lattice',
      'darwin_machine', 'quantum_bridge'
    ];
    modules.forEach(name => {
      this.moduleRegistry.set(name, {
        name, status: 'recovering', performance: 0, memoryUsage: 0, errorRate: 1, uptime: Date.now()
      });
    });
  }

  registerHealthSource(name: string, source: ModuleHealthSource): void {
    this.healthSources.set(name, source);
    if (!this.moduleRegistry.has(name)) {
      this.moduleRegistry.set(name, { name, status: 'recovering', performance: 0, memoryUsage: 0, errorRate: 1, uptime: Date.now() });
    }
  }

  async scanAllModules(): Promise<SystemHealth> {
    const moduleScores: Record<string, number> = {};
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let totalScore = 0, count = 0;

    for (const [name, health] of this.moduleRegistry) {
      const source = this.healthSources.get(name);
      if (source) {
        try {
          const observed = source();
          health.status = observed.status;
          health.performance = Math.min(1, Math.max(0, observed.performance));
          health.memoryUsage = Math.min(1, Math.max(0, observed.memoryUsage));
          health.errorRate = Math.min(1, Math.max(0, observed.errorRate));
        } catch {
          health.status = 'failed';
          health.performance = 0;
          health.errorRate = 1;
        }
      } else {
        health.status = 'failed';
        health.performance = 0;
        health.errorRate = 1;
      }

      const score = health.performance * 0.5 + (1 - health.errorRate) * 0.3 + (1 - health.memoryUsage) * 0.2;
      moduleScores[name] = score;
      totalScore += score;
      count++;

      if (score < 0.5) criticalIssues.push(`${name} crítico (${(score * 100).toFixed(1)}%)`);
      else if (score < 0.7) warnings.push(`${name} degradado (${(score * 100).toFixed(1)}%)`);
      if (health.errorRate > 0.05) recommendations.push(`Reinicializar ${name}`);
    }

    const result: SystemHealth = {
      overallScore: totalScore / count, moduleScores, criticalIssues,
      warnings, recommendations, lastScanTimestamp: Date.now()
    };
    this.scanHistory.push(result);
    if (this.scanHistory.length > 100) this.scanHistory = this.scanHistory.slice(-50);
    return result;
  }

  getAllModules(): ModuleHealth[] { return Array.from(this.moduleRegistry.values()); }
  getScanHistory(): SystemHealth[] { return [...this.scanHistory]; }
}

export type RecoveryHandler = (moduleName: string) => Promise<{ status: ModuleHealth['status']; detail?: string } | void> | { status: ModuleHealth['status']; detail?: string } | void;

export class ReconstructionEngine {
  private history: Array<{ timestamp: number; moduleName: string; success: boolean; detail?: string }> = [];
  private handlers = new Map<string, RecoveryHandler>();

  registerRecoveryHandler(moduleName: string, handler: RecoveryHandler): void {
    this.handlers.set(moduleName, handler);
  }

  async rebuildModule(moduleName: string): Promise<any> {
    const handler = this.handlers.get(moduleName);
    if (!handler) {
      const detail = 'RECOVERY_HANDLER_NOT_REGISTERED';
      this.history.push({ timestamp: Date.now(), moduleName, success: false, detail });
      return { name: moduleName, status: 'failed', detail };
    }
    try {
      const result = await handler(moduleName);
      this.history.push({ timestamp: Date.now(), moduleName, success: true, detail: result?.detail });
      return { name: moduleName, status: result?.status ?? 'recovering', detail: result?.detail };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.history.push({ timestamp: Date.now(), moduleName, success: false, detail });
      return { name: moduleName, status: 'failed', detail };
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
  private _diagnosticSource: (() => ModuleHealth[]) | null = null;

  constructor(safeCore: SafeSelfImprovementCore) {
    this.safe_core = safeCore;
    this.integrity_scanner = new IntegrityScanner();
    this.reconstruction_engine = new ReconstructionEngine();
  }

  get isRunning() { return this._isRunning; }

  registerHealthSource(name: string, source: ModuleHealthSource): void {
    this.integrity_scanner.registerHealthSource(name, source);
  }

  registerRecoveryHandler(moduleName: string, handler: RecoveryHandler): void {
    this.reconstruction_engine.registerRecoveryHandler(moduleName, handler);
  }

  setDiagnosticHealthSource(source: () => ModuleHealth[]): void {
    this._diagnosticSource = source;
  }

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
    if (this._diagnosticSource) {
      for (const diagnostic of this._diagnosticSource()) {
        this.integrity_scanner.registerHealthSource(diagnostic.name, () => diagnostic);
      }
    }
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