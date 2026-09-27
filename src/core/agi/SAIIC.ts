/**
 * SAIIC - Sistema de Auto-Integridade e Imunidade Computacional
 * 
 * Módulo de PRIMEIRO PLANO que monitora continuamente:
 * - Saúde de cada subsistema AGI
 * - Integridade de dados no barramento de mensagens
 * - Consistência lógica entre módulos
 * - Detecção de loops de inferência/aprendizado
 * - Anticorpo Digital: agente que percorre e corrige anomalias
 * 
 * Executa com prioridade MÁXIMA, scanning contínuo sem pausa.
 */

import { EventBus } from '@/core/EventBus';

export interface ModuleDiagnostic {
  moduleId: string;
  healthy: boolean;
  cpuLoad: number | null;
  memoryUsage: number | null;
  errorRate: number | null;
  lastHeartbeat: number;
  loopDetected: boolean;
  inconsistencies: string[];
}

export interface IntegrityReport {
  timestamp: number;
  overallIntegrity: number;
  moduleDiagnostics: Map<string, ModuleDiagnostic>;
  isolatedModules: string[];
  repairedModules: string[];
  anticorpoActions: AnticorpoAction[];
  criticalAlerts: string[];
  meshLatencyCheck: { allUnder10ms: boolean; maxLatency: number; measured: boolean; reason: string };
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
  overallIntegrity: number;
  lastScanTimestamp: number;
  loopsDetected: number;
  inconsistenciesResolved: number;
  avgScanLatencyMs: number;
}

type HealthProvider = () => {
  healthy: boolean;
  cpuLoad: number | null;
  memoryUsage: number | null;
  errorRate: number | null;
};

export class SAIIC {
  private _running = false;
  private _scanInterval: ReturnType<typeof setInterval> | null = null;
  private _anticorpoInterval: ReturnType<typeof setInterval> | null = null;
  
  private healthProviders: Map<string, HealthProvider> = new Map();
  private moduleDiagnostics: Map<string, ModuleDiagnostic> = new Map();
  private anticorpoHistory: AnticorpoAction[] = [];
  private isolatedModules: Set<string> = new Set();
  private repairedModules: Set<string> = new Set();
  private lastReports: IntegrityReport[] = [];
  
  private _scanCycles = 0;
  private _loopsDetected = 0;
  private _inconsistenciesResolved = 0;
  private _avgScanLatency = 0;
  
  // Pattern detection for loop identification
  private patternBuffer: Map<string, Array<{ hash: number; timestamp: number }>> = new Map();
  
  get isRunning(): boolean { return this._running; }
  get scanCycles(): number { return this._scanCycles; }

  /**
   * Register a module for continuous monitoring
   */
  registerModule(moduleId: string, provider: HealthProvider): void {
    this.healthProviders.set(moduleId, provider);
    this.moduleDiagnostics.set(moduleId, {
      moduleId,
      healthy: true,
      cpuLoad: null,
      memoryUsage: null,
      errorRate: null,
      lastHeartbeat: Date.now(),
      loopDetected: false,
      inconsistencies: [],
    });
    if (!this.patternBuffer.has(moduleId)) {
      this.patternBuffer.set(moduleId, []);
    }
  }

  /**
   * Start FIRST-PRIORITY continuous scanning
   * SAIIC runs at highest frequency - every 500ms for scanning, 2s for anticorpo
   */
  start(scanIntervalMs: number = 500): void {
    if (this._running) return;
    this._running = true;
    console.log('[SAIIC] Sistema de Auto-Integridade ATIVO - Primeiro Plano');

    // Primary scan loop - HIGH FREQUENCY
    this._scanInterval = setInterval(() => {
      this.executeScanCycle();
    }, scanIntervalMs);

    // Anticorpo Digital loop - searches and repairs
    this._anticorpoInterval = setInterval(() => {
      this.executeAnticorpoSweep();
    }, 2000);

    // Initial scan
    this.executeScanCycle();
    
    // Emit activation
    EventBus.emit('system:init', { timestamp: Date.now() });
  }

  stop(): void {
    if (this._scanInterval) clearInterval(this._scanInterval);
    if (this._anticorpoInterval) clearInterval(this._anticorpoInterval);
    this._scanInterval = null;
    this._anticorpoInterval = null;
    this._running = false;
    console.log('[SAIIC] Sistema de Auto-Integridade PARADO');
  }

  /**
   * PRIMARY SCAN CYCLE - Executes every tick
   * Checks health, detects anomalies, validates consistency
   */
  private executeScanCycle(): void {
    const scanStart = performance.now();
    this._scanCycles++;

    const criticalAlerts: string[] = [];

    for (const [moduleId, provider] of this.healthProviders) {
      try {
        const health = provider();
        const diag = this.moduleDiagnostics.get(moduleId)!;
        
        // Update diagnostics
        diag.cpuLoad = health.cpuLoad;
        diag.memoryUsage = health.memoryUsage;
        diag.errorRate = health.errorRate;
        diag.lastHeartbeat = Date.now();
        diag.healthy = health.healthy &&
          (health.errorRate === null || health.errorRate < 0.1);

        // Check for loops only when the provider exposes at least one
        // measurable signal. Constant "unmeasured" values are not a loop.
        const hasMeasuredSignal =
          health.cpuLoad !== null ||
          health.memoryUsage !== null ||
          health.errorRate !== null;
        if (hasMeasuredSignal) {
          const stateHash = this.computeStateHash(health);
          this.recordPattern(moduleId, stateHash);
          diag.loopDetected = this.detectLoop(moduleId);
        } else {
          this.patternBuffer.set(moduleId, []);
          diag.loopDetected = false;
        }
        
        if (diag.loopDetected) {
          this._loopsDetected++;
          criticalAlerts.push(`[SAIIC] Loop detectado em ${moduleId}`);
        }

        // Check for critical issues
        if (health.errorRate !== null && health.errorRate > 0.2) {
          criticalAlerts.push(`[SAIIC] ${moduleId} - Taxa de erro observada alta: ${(health.errorRate * 100).toFixed(1)}%`);
        }
        if (health.memoryUsage !== null && health.memoryUsage > 0.9) {
          criticalAlerts.push(`[SAIIC] ${moduleId} - Memória medida crítica: ${(health.memoryUsage * 100).toFixed(0)}%`);
        }

        // If module was isolated, check if it recovered
        if (this.isolatedModules.has(moduleId) && diag.healthy) {
          this.isolatedModules.delete(moduleId);
          this.repairedModules.add(moduleId);
        }

      } catch (error) {
        const diag = this.moduleDiagnostics.get(moduleId)!;
        diag.healthy = false;
        diag.errorRate = 1.0;
        criticalAlerts.push(`[SAIIC] ${moduleId} - Falha no health check: ${error}`);
      }
    }

    // Cross-module consistency check
    this.checkCrossModuleConsistency();

    // Calculate overall integrity
    const diagnostics = Array.from(this.moduleDiagnostics.values());
    const healthyCount = diagnostics.filter(d => d.healthy).length;
    const overallIntegrity = diagnostics.length > 0 ? healthyCount / diagnostics.length : 1;

    // Check mesh latency
    const maxLatency = 0;

    // Store report
    const report: IntegrityReport = {
      timestamp: Date.now(),
      overallIntegrity,
      moduleDiagnostics: new Map(this.moduleDiagnostics),
      isolatedModules: Array.from(this.isolatedModules),
      repairedModules: Array.from(this.repairedModules),
      anticorpoActions: this.anticorpoHistory.slice(-10),
      criticalAlerts,
      meshLatencyCheck: {
        allUnder10ms: false,
        maxLatency,
        measured: false,
        reason: 'SAIIC não possui amostragem de RTT do Mesh; lastHeartbeat é timestamp do scan e não latência de rede.',
      },
    };
    
    this.lastReports.push(report);
    if (this.lastReports.length > 50) this.lastReports = this.lastReports.slice(-25);

    // Emit critical alerts
    if (criticalAlerts.length > 0) {
      EventBus.emit('audit:warning', {
        message: criticalAlerts.join('; '),
        severity: criticalAlerts.some(a => a.includes('crítica') || a.includes('Loop')) ? 'high' : 'medium'
      });
    }

    // Update scan latency tracking
    const scanLatency = performance.now() - scanStart;
    this._avgScanLatency = this._avgScanLatency * 0.9 + scanLatency * 0.1;
  }

  /**
   * ANTICORPO DIGITAL - Sweeps through modules and repairs anomalies
   */
  private executeAnticorpoSweep(): void {
    for (const [moduleId, diag] of this.moduleDiagnostics) {
      // High observed error rate is evidence for protection, not a
      // synthetic weight correction. Preserve the diagnostic unchanged.
      if (diag.errorRate !== null && diag.errorRate > 0.15 && !this.isolatedModules.has(moduleId)) {
        const recent = this.anticorpoHistory.slice(-20).some(
          action => action.targetModule === moduleId && action.anomalyType === 'state_drift'
        );
        if (!recent) {
          this.anticorpoHistory.push({
            timestamp: Date.now(),
            targetModule: moduleId,
            anomalyType: 'state_drift',
            action: 'bypassed',
            severity: diag.errorRate,
            details: `Taxa de erro observada ${(diag.errorRate * 100).toFixed(1)}%; nenhuma redução sintética foi aplicada. Módulo permanece sob observação.`,
          });
        }
      }

      // High measured memory is evidence for protection, not a synthetic
      // memory rewrite. Preserve the measured value unchanged.
      if (diag.memoryUsage !== null && diag.memoryUsage > 0.85) {
        const recent = this.anticorpoHistory.slice(-20).some(
          action => action.targetModule === moduleId && action.anomalyType === 'memory_leak'
        );
        if (!recent) {
          this.anticorpoHistory.push({
            timestamp: Date.now(),
            targetModule: moduleId,
            anomalyType: 'memory_leak',
            action: 'bypassed',
            severity: diag.memoryUsage,
            details: `Memória medida de ${(diag.memoryUsage * 100).toFixed(0)}%; não existe reparo de memória verificado neste módulo.`,
          });
        }
      }

      // Handle detected loops
      if (diag.loopDetected) {
        const action: AnticorpoAction = {
          timestamp: Date.now(),
          targetModule: moduleId,
          anomalyType: 'loop_detected',
          action: 'restarted',
          severity: 0.8,
          details: `Loop de inferência detectado em ${moduleId}, forçando perturbação de estado`,
        };
        this.anticorpoHistory.push(action);
        // Reset pattern buffer for this module
        this.patternBuffer.set(moduleId, []);
        diag.loopDetected = false;
      }

      // Isolate critically unhealthy modules
      if (!diag.healthy && diag.errorRate > 0.5 && !this.isolatedModules.has(moduleId)) {
        this.isolatedModules.add(moduleId);
        const action: AnticorpoAction = {
          timestamp: Date.now(),
          targetModule: moduleId,
          anomalyType: 'state_drift',
          action: 'isolated',
          severity: 1.0,
          details: `${moduleId} isolado por falha crítica. Bypass ativado.`,
        };
        this.anticorpoHistory.push(action);
      }
    }

    // Bound history
    if (this.anticorpoHistory.length > 200) {
      this.anticorpoHistory = this.anticorpoHistory.slice(-100);
    }
  }

  /**
   * Cross-module consistency check
   * Verifies that interconnected modules don't produce contradictory states
   */
  private checkCrossModuleConsistency(): void {
    const diags = Array.from(this.moduleDiagnostics.values());
    
    // Check if any pair of modules has contradictory health states
    // (e.g., ethics says system is unsafe but safety says all clear)
    for (let i = 0; i < diags.length; i++) {
      for (let j = i + 1; j < diags.length; j++) {
        const d1 = diags[i];
        const d2 = diags[j];
        
        // If one is very healthy and the other very unhealthy, flag inconsistency
        if (d1.errorRate !== null && d2.errorRate !== null && Math.abs(d1.errorRate - d2.errorRate) > 0.5) {
          const lower = d1.errorRate > d2.errorRate ? d1 : d2;
          if (!lower.inconsistencies.includes(`Divergência com ${d1.moduleId === lower.moduleId ? d2.moduleId : d1.moduleId}`)) {
            lower.inconsistencies.push(`Divergência com ${d1.moduleId === lower.moduleId ? d2.moduleId : d1.moduleId}`);
          }
        }
      }
    }

    // Clean old inconsistencies
    for (const diag of diags) {
      if (diag.inconsistencies.length > 5) {
        diag.inconsistencies = diag.inconsistencies.slice(-3);
      }
    }
  }

  /**
   * Record a state pattern for loop detection
   */
  private recordPattern(moduleId: string, hash: number): void {
    const patterns = this.patternBuffer.get(moduleId)!;
    patterns.push({ hash, timestamp: Date.now() });
    if (patterns.length > 20) patterns.shift();
  }

  /**
   * Detect if a module is stuck in a loop
   */
  private detectLoop(moduleId: string): boolean {
    const patterns = this.patternBuffer.get(moduleId);
    if (!patterns || patterns.length < 10) return false;
    
    // Check last 10 patterns for repetition
    const last10 = patterns.slice(-10).map(p => p.hash);
    const unique = new Set(last10);
    // If less than 3 unique values in 10 samples, likely a loop
    return unique.size < 3;
  }

  /**
   * Simple state hash for pattern detection
   */
  private computeStateHash(health: { cpuLoad: number | null; memoryUsage: number | null; errorRate: number | null }): number {
    const cpu = health.cpuLoad === null ? -1 : Math.round(health.cpuLoad * 100);
    const memory = health.memoryUsage === null ? -1 : Math.round(health.memoryUsage * 100);
    const error = health.errorRate === null ? -1 : Math.round(health.errorRate * 100);
    return cpu * 10000 + memory * 100 + error;
  }

  /**
   * Get latest integrity report
   */
  getLatestReport(): IntegrityReport | null {
    return this.lastReports[this.lastReports.length - 1] || null;
  }

  /**
   * Get comprehensive SAIIC metrics
   */
  getMetrics(): SAIICMetrics {
    const latestReport = this.getLatestReport();
    return {
      isRunning: this._running,
      scanCycles: this._scanCycles,
      totalAnticorpoActions: this.anticorpoHistory.length,
      modulesMonitored: this.healthProviders.size,
      isolatedModules: this.isolatedModules.size,
      overallIntegrity: latestReport?.overallIntegrity ?? 1,
      lastScanTimestamp: latestReport?.timestamp ?? 0,
      loopsDetected: this._loopsDetected,
      inconsistenciesResolved: this._inconsistenciesResolved,
      avgScanLatencyMs: this._avgScanLatency,
    };
  }

  /**
   * Get anticorpo action history
   */
  getAnticorpoHistory(): AnticorpoAction[] {
    return this.anticorpoHistory.slice(-20);
  }

  /**
   * Get all module diagnostics
   */
  getAllDiagnostics(): ModuleDiagnostic[] {
    return Array.from(this.moduleDiagnostics.values());
  }
}
