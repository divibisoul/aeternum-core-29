/**
 * SAIIC - Sistema de Auto-Integridade e Imunidade Computacional
 *
 * Continuous integrity monitor. Diagnostic metrics are evidence-bearing:
 * health-only providers do not fabricate CPU/RAM/error measurements.
 */
import { EventBus } from '@/core/EventBus';

export interface ModuleDiagnostic {
  moduleId: string;
  healthy: boolean;
  cpuLoad: number | null;
  memoryUsage: number | null;
  errorRate: number | null;
  metricsObserved: boolean;
  lastHeartbeat: number;
  loopDetected: boolean;
  inconsistencies: string[];
}

export interface IntegrityReport {
  timestamp: number;
  overallIntegrity: number | null;
  moduleDiagnostics: Map<string, ModuleDiagnostic>;
  isolatedModules: string[];
  repairedModules: string[];
  anticorpoActions: AnticorpoAction[];
  criticalAlerts: string[];
  meshLatencyCheck: { allUnder10ms: boolean; maxLatency: number; measured: boolean };
}

export interface AnticorpoAction {
  timestamp: number;
  targetModule: string;
  anomalyType: 'weight_corruption' | 'state_drift' | 'loop_detected' | 'consistency_violation' | 'memory_leak';
  action: 'corrected' | 'isolated' | 'restarted' | 'bypassed';
  severity: number;
  details: string;
}

export interface SAIICMetrics {
  isRunning: boolean;
  scanCycles: number;
  totalAnticorpoActions: number;
  modulesMonitored: number;
  isolatedModules: number;
  overallIntegrity: number | null;
  lastScanTimestamp: number;
  loopsDetected: number;
  inconsistenciesResolved: number;
  avgScanLatencyMs: number;
}

export interface HealthSample {
  healthy: boolean;
  cpuLoad?: number;
  memoryUsage?: number;
  errorRate?: number;
  observed?: boolean;
}

type HealthProvider = () => HealthSample;
type RemediationProvider = () => boolean | void | Promise<boolean | void>;

export class SAIIC {
  private _running = false;
  private _scanInterval: ReturnType<typeof setInterval> | null = null;
  private _anticorpoInterval: ReturnType<typeof setInterval> | null = null;
  private healthProviders: Map<string, HealthProvider> = new Map();
  private remediationProviders: Map<string, RemediationProvider> = new Map();
  private isolationProviders: Map<string, RemediationProvider> = new Map();
  private moduleDiagnostics: Map<string, ModuleDiagnostic> = new Map();
  private anticorpoHistory: AnticorpoAction[] = [];
  private isolatedModules: Set<string> = new Set();
  private repairedModules: Set<string> = new Set();
  private lastReports: IntegrityReport[] = [];
  private _scanCycles = 0;
  private _loopsDetected = 0;
  private _inconsistenciesResolved = 0;
  private _avgScanLatency = 0;
  private patternBuffer: Map<string, Array<{ hash: number; timestamp: number }>> = new Map();

  get isRunning(): boolean { return this._running; }
  get scanCycles(): number { return this._scanCycles; }

  registerModule(moduleId: string, provider: HealthProvider): void {
    this.healthProviders.set(moduleId, provider);
    this.moduleDiagnostics.set(moduleId, {
      moduleId,
      healthy: false,
      cpuLoad: null,
      memoryUsage: null,
      errorRate: null,
      metricsObserved: false,
      lastHeartbeat: 0,
      loopDetected: false,
      inconsistencies: [],
    });
    if (!this.patternBuffer.has(moduleId)) this.patternBuffer.set(moduleId, []);
  }

  registerRemediation(moduleId: string, provider: RemediationProvider): void {
    this.remediationProviders.set(moduleId, provider);
  }

  registerIsolationHandler(moduleId: string, provider: RemediationProvider): void {
    this.isolationProviders.set(moduleId, provider);
  }

  start(scanIntervalMs: number = 500): void {
    if (this._running) return;
    this._running = true;
    this._scanInterval = setInterval(() => this.executeScanCycle(), scanIntervalMs);
    this._anticorpoInterval = setInterval(() => this.executeAnticorpoSweep(), 2000);
    this.executeScanCycle();
    EventBus.emit('system:init', { timestamp: Date.now() });
  }

  stop(): void {
    if (this._scanInterval) clearInterval(this._scanInterval);
    if (this._anticorpoInterval) clearInterval(this._anticorpoInterval);
    this._scanInterval = null;
    this._anticorpoInterval = null;
    this._running = false;
  }

  private executeScanCycle(): void {
    const scanStart = performance.now();
    this._scanCycles++;
    const criticalAlerts: string[] = [];

    for (const [moduleId, provider] of this.healthProviders) {
      try {
        const health = provider();
        const diag = this.moduleDiagnostics.get(moduleId)!;
        const cpuLoad = Number.isFinite(health.cpuLoad) ? health.cpuLoad! : null;
        const memoryUsage = Number.isFinite(health.memoryUsage) ? health.memoryUsage! : null;
        const errorRate = Number.isFinite(health.errorRate) ? health.errorRate! : null;
        const observed = health.observed ?? (cpuLoad !== null || memoryUsage !== null || errorRate !== null);

        diag.cpuLoad = cpuLoad;
        diag.memoryUsage = memoryUsage;
        diag.errorRate = errorRate;
        diag.metricsObserved = observed;
        diag.lastHeartbeat = Date.now();
        diag.healthy = Boolean(health.healthy) && (errorRate === null || errorRate < 0.1);

        if (cpuLoad !== null && memoryUsage !== null && errorRate !== null) {
          const stateHash = this.computeStateHash({ cpuLoad, memoryUsage, errorRate });
          this.recordPattern(moduleId, stateHash);
          diag.loopDetected = this.detectLoop(moduleId);
          if (diag.loopDetected) {
            this._loopsDetected++;
            criticalAlerts.push(`[SAIIC] Loop detectado em ${moduleId}`);
          }
        } else {
          diag.loopDetected = false;
        }

        if (errorRate !== null && errorRate > 0.2) {
          criticalAlerts.push(`[SAIIC] ${moduleId} - Taxa de erro observada alta: ${(errorRate * 100).toFixed(1)}%`);
        }
        if (memoryUsage !== null && memoryUsage > 0.9) {
          criticalAlerts.push(`[SAIIC] ${moduleId} - Memória observada crítica: ${(memoryUsage * 100).toFixed(0)}%`);
        }

        if (this.isolatedModules.has(moduleId) && diag.healthy) {
          this.isolatedModules.delete(moduleId);
          this.repairedModules.add(moduleId);
        }
      } catch (error) {
        const diag = this.moduleDiagnostics.get(moduleId)!;
        diag.healthy = false;
        diag.errorRate = 1.0;
        diag.metricsObserved = true;
        diag.lastHeartbeat = Date.now();
        criticalAlerts.push(`[SAIIC] ${moduleId} - Falha no health check: ${String(error)}`);
      }
    }

    this.checkCrossModuleConsistency();
    const diagnostics = Array.from(this.moduleDiagnostics.values());
    const healthyCount = diagnostics.filter(d => d.healthy).length;
    const overallIntegrity = diagnostics.length > 0 ? healthyCount / diagnostics.length : 1;

    const report: IntegrityReport = {
      timestamp: Date.now(),
      overallIntegrity,
      moduleDiagnostics: new Map(this.moduleDiagnostics),
      isolatedModules: Array.from(this.isolatedModules),
      repairedModules: Array.from(this.repairedModules),
      anticorpoActions: this.anticorpoHistory.slice(-10),
      criticalAlerts,
      meshLatencyCheck: { allUnder10ms: false, maxLatency: 0, measured: false },
    };

    this.lastReports.push(report);
    if (this.lastReports.length > 50) this.lastReports = this.lastReports.slice(-25);

    if (criticalAlerts.length > 0) {
      EventBus.emit('audit:warning', {
        message: criticalAlerts.join('; '),
        severity: criticalAlerts.some(a => a.includes('crítica') || a.includes('Loop') || a.includes('observada alta')) ? 'high' : 'medium',
      });
    }

    const scanLatency = performance.now() - scanStart;
    this._avgScanLatency = this._avgScanLatency * 0.9 + scanLatency * 0.1;
  }

  private executeAnticorpoSweep(): void {
    for (const [moduleId, diag] of this.moduleDiagnostics) {
      if (diag.errorRate !== null && diag.errorRate > 0.15 && !this.isolatedModules.has(moduleId)) {
        const provider = this.remediationProviders.get(moduleId);
        let corrected = false;
        if (provider) {
          try {
            corrected = provider() !== false;
          } catch {
            corrected = false;
          }
        }
        if (corrected) {
          this.anticorpoHistory.push({
            timestamp: Date.now(),
            targetModule: moduleId,
            anomalyType: 'weight_corruption',
            action: 'corrected',
            severity: diag.errorRate,
            details: 'Remediação do módulo executada por handler registrado.',
          });
          this._inconsistenciesResolved++;
        } else {
          this.anticorpoHistory.push({
            timestamp: Date.now(),
            targetModule: moduleId,
            anomalyType: 'weight_corruption',
            action: 'bypassed',
            severity: diag.errorRate,
            details: 'Nenhum handler de remediação observável; SAIIC não fabricou uma correção de métrica.',
          });
        }
      }

      if (diag.memoryUsage !== null && diag.memoryUsage > 0.85) {
        const provider = this.remediationProviders.get(moduleId);
        let corrected = false;
        if (provider) {
          try {
            corrected = provider() !== false;
          } catch {
            corrected = false;
          }
        }
        if (corrected) {
          this.anticorpoHistory.push({
            timestamp: Date.now(),
            targetModule: moduleId,
            anomalyType: 'memory_leak',
            action: 'corrected',
            severity: diag.memoryUsage,
            details: 'Remediação de memória executada por handler registrado.',
          });
          this._inconsistenciesResolved++;
        } else {
          this.anticorpoHistory.push({
            timestamp: Date.now(),
            targetModule: moduleId,
            anomalyType: 'memory_leak',
            action: 'bypassed',
            severity: diag.memoryUsage,
            details: 'Ausência de remediation handler; nenhum valor de memória foi alterado artificialmente.',
          });
        }
      }

      if (diag.loopDetected) {
        this.anticorpoHistory.push({
          timestamp: Date.now(),
          targetModule: moduleId,
          anomalyType: 'loop_detected',
          action: 'corrected',
          severity: 0.8,
          details: 'Detector de padrões reinicializado após loop; o módulo não é falsamente declarado como reiniciado.',
        });
        this.patternBuffer.set(moduleId, []);
        diag.loopDetected = false;
      }

      if (!diag.healthy && diag.errorRate !== null && diag.errorRate > 0.5 && !this.isolatedModules.has(moduleId)) {
        const isolation = this.isolationProviders.get(moduleId);
        let isolated = false;
        if (isolation) {
          try {
            isolated = isolation() !== false;
          } catch {
            isolated = false;
          }
        }
        if (isolated) {
          this.isolatedModules.add(moduleId);
          this.anticorpoHistory.push({
            timestamp: Date.now(),
            targetModule: moduleId,
            anomalyType: 'state_drift',
            action: 'isolated',
            severity: 1.0,
            details: 'Handler de isolamento executado; módulo removido do fluxo por mecanismo registrado.',
          });
        } else {
          this.anticorpoHistory.push({
            timestamp: Date.now(),
            targetModule: moduleId,
            anomalyType: 'state_drift',
            action: 'bypassed',
            severity: 1.0,
            details: 'Falha crítica detectada, mas sem handler de isolamento; execução externa não foi falsificada.',
          });
        }
      }
    }

    if (this.anticorpoHistory.length > 200) this.anticorpoHistory = this.anticorpoHistory.slice(-100);
  }

  private checkCrossModuleConsistency(): void {
    const diags = Array.from(this.moduleDiagnostics.values());
    for (let i = 0; i < diags.length; i++) {
      for (let j = i + 1; j < diags.length; j++) {
        const d1 = diags[i];
        const d2 = diags[j];
        if (d1.errorRate !== null && d2.errorRate !== null && Math.abs(d1.errorRate - d2.errorRate) > 0.5) {
          const lower = d1.errorRate > d2.errorRate ? d1 : d2;
          const other = d1.errorRate === lower.errorRate ? d2.moduleId : d1.moduleId;
          const note = `Divergência com ${other}`;
          if (!lower.inconsistencies.includes(note)) lower.inconsistencies.push(note);
        }
      }
    }
    for (const diag of diags) if (diag.inconsistencies.length > 5) diag.inconsistencies = diag.inconsistencies.slice(-3);
  }

  private recordPattern(moduleId: string, hash: number): void {
    const patterns = this.patternBuffer.get(moduleId) ?? [];
    patterns.push({ hash, timestamp: Date.now() });
    if (patterns.length > 20) patterns.shift();
    this.patternBuffer.set(moduleId, patterns);
  }

  private detectLoop(moduleId: string): boolean {
    const patterns = this.patternBuffer.get(moduleId);
    if (!patterns || patterns.length < 10) return false;
    return new Set(patterns.slice(-10).map(p => p.hash)).size < 3;
  }

  private computeStateHash(health: { cpuLoad: number; memoryUsage: number; errorRate: number }): number {
    return Math.round(health.cpuLoad * 100) * 10000 +
      Math.round(health.memoryUsage * 100) * 100 +
      Math.round(health.errorRate * 100);
  }

  getLatestReport(): IntegrityReport | null {
    return this.lastReports[this.lastReports.length - 1] || null;
  }

  getMetrics(): SAIICMetrics {
    const latestReport = this.getLatestReport();
    return {
      isRunning: this._running,
      scanCycles: this._scanCycles,
      totalAnticorpoActions: this.anticorpoHistory.length,
      modulesMonitored: this.healthProviders.size,
      isolatedModules: this.isolatedModules.size,
      overallIntegrity: latestReport?.overallIntegrity ?? null,
      lastScanTimestamp: latestReport?.timestamp ?? 0,
      loopsDetected: this._loopsDetected,
      inconsistenciesResolved: this._inconsistenciesResolved,
      avgScanLatencyMs: this._avgScanLatency,
    };
  }

  getAnticorpoHistory(): AnticorpoAction[] {
    return this.anticorpoHistory.slice(-20);
  }

  getAllDiagnostics(): ModuleDiagnostic[] {
    return Array.from(this.moduleDiagnostics.values());
  }
}
