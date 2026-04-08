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

export class IntegrityScanner {
  private scanHistory: SystemHealth[] = [];
  private moduleRegistry: Map<string, ModuleHealth> = new Map();

  constructor() {
    const modules = [
      'neural_processor', 'memory_system', 'ethics_guardian',
      'consciousness_monitor', 'godel_agent', 'recursive_lattice',
      'darwin_machine', 'quantum_bridge'
    ];
    modules.forEach(name => {
      this.moduleRegistry.set(name, {
        name, status: 'healthy', performance: 0.95,
        memoryUsage: Math.random() * 0.3 + 0.1, errorRate: 0.01, uptime: Date.now()
      });
    });
  }

  async scanAllModules(): Promise<SystemHealth> {
    const moduleScores: Record<string, number> = {};
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let totalScore = 0, count = 0;

    for (const [name, health] of this.moduleRegistry) {
      health.performance = Math.min(1, Math.max(0.1, health.performance + (Math.random() - 0.5) * 0.1));
      health.errorRate = Math.max(0, health.errorRate + (Math.random() - 0.5) * 0.01);
      health.status = health.performance < 0.5 ? 'failed' : health.performance < 0.7 ? 'degraded' : 'healthy';

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

export class ReconstructionEngine {
  private history: Array<{ timestamp: number; moduleName: string; success: boolean }> = [];

  async rebuildModule(moduleName: string): Promise<any> {
    await new Promise(r => setTimeout(r, 500));
    const success = Math.random() > 0.05;
    this.history.push({ timestamp: Date.now(), moduleName, success });
    return { name: moduleName, version: `rebuilt_${Date.now()}`, performance: 0.95, status: 'healthy' };
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
