/**
 * Self-Healing Architecture - Auto-Correção e Reconstrução
 *
 * Integrity is evidence-driven. The component keeps the historical module
 * inventory but never fabricates performance/memory/error measurements or a
 * successful rebuild without a registered runtime provider.
 */
import { SafeSelfImprovementCore } from './SafeSelfImprovementCore';

export interface SystemHealth {
  overallScore: number | null;
  moduleScores: Record<string, number | null>;
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  lastScanTimestamp: number;
  observedModules: number;
  unobservedModules: string[];
}

export interface ModuleHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'failed' | 'recovering' | 'unobserved';
  performance: number | null;
  memoryUsage: number | null;
  errorRate: number | null;
  uptime: number | null;
  observed: boolean;
  source: 'PROVIDER' | 'UNOBSERVED';
}

export interface ModuleHealthProvider {
  observe: () => Promise<Partial<Pick<ModuleHealth, 'performance' | 'memoryUsage' | 'errorRate' | 'uptime'>> & { healthy?: boolean }>;
}

export class IntegrityScanner {
  private scanHistory: SystemHealth[] = [];
  private moduleRegistry: Map<string, ModuleHealth> = new Map();
  private providers: Map<string, ModuleHealthProvider> = new Map();

  constructor() {
    const modules = [
      'neural_processor', 'memory_system', 'ethics_guardian',
      'consciousness_monitor', 'godel_agent', 'recursive_lattice',
      'darwin_machine', 'quantum_bridge'
    ];
    modules.forEach(name => {
      this.moduleRegistry.set(name, {
        name,
        status: 'unobserved',
        performance: null,
        memoryUsage: null,
        errorRate: null,
        uptime: null,
        observed: false,
        source: 'UNOBSERVED',
      });
    });
  }

  registerModule(name: string, provider: ModuleHealthProvider): void {
    if (!name.trim() || !provider || typeof provider.observe !== 'function') {
      throw new Error('SELF_HEALING_PROVIDER_INVALID');
    }
    this.providers.set(name, provider);
    if (!this.moduleRegistry.has(name)) {
      this.moduleRegistry.set(name, {
        name,
        status: 'unobserved',
        performance: null,
        memoryUsage: null,
        errorRate: null,
        uptime: null,
        observed: false,
        source: 'UNOBSERVED',
      });
    }
  }

  async scanAllModules(): Promise<SystemHealth> {
    const moduleScores: Record<string, number | null> = {};
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const unobservedModules: string[] = [];
    let scoreSum = 0;
    let observedCount = 0;

    for (const [name, health] of this.moduleRegistry) {
      const provider = this.providers.get(name);
      if (!provider) {
        health.status = 'unobserved';
        health.performance = null;
        health.memoryUsage = null;
        health.errorRate = null;
        health.uptime = null;
        health.observed = false;
        health.source = 'UNOBSERVED';
        moduleScores[name] = null;
        unobservedModules.push(name);
        warnings.push(`${name} sem provider de telemetria registrado`);
        continue;
      }

      try {
        const observation = await provider.observe();
        const performance = Number.isFinite(observation.performance) ? observation.performance ?? null : null;
        const memoryUsage = Number.isFinite(observation.memoryUsage) ? observation.memoryUsage ?? null : null;
        const errorRate = Number.isFinite(observation.errorRate) ? observation.errorRate ?? null : null;
        const uptime = Number.isFinite(observation.uptime) ? observation.uptime ?? null : null;

        health.performance = performance;
        health.memoryUsage = memoryUsage;
        health.errorRate = errorRate;
        health.uptime = uptime;
        health.observed = true;
        health.source = 'PROVIDER';

        const scoreParts = [
          performance,
          memoryUsage === null ? null : 1 - Math.max(0, Math.min(1, memoryUsage)),
          errorRate === null ? null : 1 - Math.max(0, Math.min(1, errorRate)),
        ].filter((value): value is number => value !== null && Number.isFinite(value));

        const score = scoreParts.length > 0
          ? scoreParts.reduce((sum, value) => sum + value, 0) / scoreParts.length
          : null;

        moduleScores[name] = score;

        if (score === null) {
          health.status = 'unobserved';
          unobservedModules.push(name);
          warnings.push(`${name} sem métricas numéricas observáveis suficientes`);
          continue;
        }

        observedCount++;
        scoreSum += score;
        const healthy = observation.healthy ?? (errorRate === null || errorRate < 0.1);
        health.status = !healthy || score < 0.5 ? 'failed'
          : score < 0.7 ? 'degraded'
          : 'healthy';

        if (score < 0.5) criticalIssues.push(`${name} crítico (${(score * 100).toFixed(1)}%)`);
        else if (score < 0.7) warnings.push(`${name} degradado (${(score * 100).toFixed(1)}%)`);
        if (errorRate !== null && errorRate > 0.05) {
          recommendations.push(`Investigar taxa de erro observada em ${name}`);
        }
      } catch (error) {
        health.status = 'failed';
        health.observed = true;
        health.source = 'PROVIDER';
        health.errorRate = 1;
        health.uptime = Date.now();
        moduleScores[name] = 0;
        observedCount++;
        criticalIssues.push(`${name} - provider falhou: ${String(error)}`);
        recommendations.push(`Corrigir provider de telemetria de ${name}`);
      }
    }

    const result: SystemHealth = {
      overallScore: observedCount > 0 ? scoreSum / observedCount : null,
      moduleScores,
      criticalIssues,
      warnings,
      recommendations,
      lastScanTimestamp: Date.now(),
      observedModules: observedCount,
      unobservedModules,
    };

    this.scanHistory.push(result);
    if (this.scanHistory.length > 100) this.scanHistory = this.scanHistory.slice(-50);
    return result;
  }

  getAllModules(): ModuleHealth[] { return Array.from(this.moduleRegistry.values()).map(module => ({ ...module })); }
  getScanHistory(): SystemHealth[] { return [...this.scanHistory]; }
}

export type ReconstructionResult = {
  name: string;
  version: string | null;
  performance: number | null;
  status: 'REBUILT' | 'FAILED' | 'PENDING_RECONSTRUCTION';
  success: boolean;
  errorCode?: string;
};

export type ReconstructionProvider = (moduleName: string) => Promise<ReconstructionResult>;

export class ReconstructionEngine {
  private history: ReconstructionResult[] = [];
  private providers: Map<string, ReconstructionProvider> = new Map();

  registerProvider(moduleName: string, provider: ReconstructionProvider): void {
    if (!moduleName.trim() || typeof provider !== 'function') {
      throw new Error('RECONSTRUCTION_PROVIDER_INVALID');
    }
    this.providers.set(moduleName, provider);
  }

  async rebuildModule(moduleName: string): Promise<ReconstructionResult> {
    const provider = this.providers.get(moduleName);
    if (!provider) {
      const pending: ReconstructionResult = {
        name: moduleName,
        version: null,
        performance: null,
        status: 'PENDING_RECONSTRUCTION',
        success: false,
        errorCode: 'RECONSTRUCTION_HANDLER_UNAVAILABLE',
      };
      this.history.push(pending);
      return pending;
    }

    try {
      const result = await provider(moduleName);
      if (!result || typeof result.success !== 'boolean') {
        throw new Error('INVALID_RECONSTRUCTION_RESULT');
      }
      this.history.push(result);
      return result;
    } catch (error) {
      const failed: ReconstructionResult = {
        name: moduleName,
        version: null,
        performance: null,
        status: 'FAILED',
        success: false,
        errorCode: error instanceof Error ? error.message : 'RECONSTRUCTION_FAILED',
      };
      this.history.push(failed);
      return failed;
    }
  }

  getHistory(): ReconstructionResult[] { return [...this.history]; }
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
    this.diagnosticInterval = window.setInterval(() => {
      void this.performDiagnosticCycle();
    }, intervalMs);
    void this.performDiagnosticCycle();
  }

  stopContinuousDiagnosis(): void {
    if (this.diagnosticInterval !== null) clearInterval(this.diagnosticInterval);
    this.diagnosticInterval = null;
    this._isRunning = false;
  }

  async performDiagnosticCycle(): Promise<SystemHealth> {
    const health = await this.integrity_scanner.scanAllModules();
    const targets = Object.entries(health.moduleScores)
      .filter(([, score]) => score !== null && score < 0.5)
      .map(([name]) => name);

    for (const module of targets) {
      await this.reconstruction_engine.rebuildModule(module);
    }
    return health;
  }

  getLatestHealth(): SystemHealth | null {
    const history = this.integrity_scanner.getScanHistory();
    return history[history.length - 1] || null;
  }
}
