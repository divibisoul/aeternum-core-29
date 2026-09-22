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
  cpuLoad: number;
  memoryUsage: number;
  errorRate: number;
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
  meshHeartbeatCheck: { allFreshWithin10s: boolean; maxAgeMs: number; evidence: 'HEARTBEAT_AGE' };
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
  cpuLoad: number;
  memoryUsage: number;
  errorRate: number;
};

export class SAIIC {
  private _running = false;
  private _scanInterval: ReturnType<typeof setInterval> | null = null;
  private _anticorpoInterval: ReturnType<typeof setInterval> | null = null;
  
  private healthProviders: Map<string, HealthProvider> = new Map();
  private recoveryHandlers: Map<string, () => boolean | Promise<boolean>> = new Map();
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
      cpuLoad: 0,
      memoryUsage: 0,
      errorRate: 0,
      lastHeartbeat: Date.now(),
      loopDetected: false,
      inconsistencies: [],
    });
    if (!this.patternBuffer.has(moduleId)) {
      this.patternBuffer.set(moduleId, []);
    }
  }

  registerRecoveryHandler(moduleId: string, handler: () => boolean | Promise<boolean>): void {
    this.recoveryHandlers.set(moduleId, handler);
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
        diag.healthy = health.healthy && health.errorRate < 0.1;

        // Check for loops (same output pattern repeated)
        const stateHash = this.computeStateHash(health);
        this.recordPattern(moduleId, stateHash);
        diag.loopDetected = this.detectLoop(moduleId);
        
        if (diag.loopDetected) {
          this._loopsDetected++;
          criticalAlerts.push(`[SAIIC] Loop detectado em ${moduleId}`);
        }

        // Check for critical issues
        if (health.errorRate > 0.2) {
          criticalAlerts.push(`[SAIIC] ${moduleId} - Taxa de erro alta: ${(health.errorRate * 100).toFixed(1)}%`);
        }
        if (health.memoryUsage > 0.9) {
          criticalAlerts.push(`[SAIIC] ${moduleId} - Memória crítica: ${(health.memoryUsage * 100).toFixed(0)}%`);
        }

        // If module was isolated, check if it recovered
        if (this.isolatedModules.has(moduleId) && diag.healthy) {
          this.isolatedModules.delete(moduleId);
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

    // Idade do heartbeat não é latência de rede.
    const heartbeatAges = diagnostics.map(d => Date.now() - d.lastHeartbeat);
    const maxHeartbeatAge = Math.max(...heartbeatAges, 0);

    // Store report
    const report: IntegrityReport = {
      timestamp: Date.now(),
      overallIntegrity,
      moduleDiagnostics: new Map(this.moduleDiagnostics),
      isolatedModules: Array.from(this.isolatedModules),
      repairedModules: Array.from(this.repairedModules),
      anticorpoActions: this.anticorpoHistory.slice(-10),
      criticalAlerts,
      meshHeartbeatCheck: {
        allFreshWithin10s: maxHeartbeatAge < 10_000,
        maxAgeMs: maxHeartbeatAge,
        evidence: 'HEARTBEAT_AGE',
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
      // Uma anomalia só pode ser corrigida por um executor real.
      if (diag.errorRate > 0.15 && !this.isolatedModules.has(moduleId)) {
        const handler = this.recoveryHandlers.get(moduleId);
        let recovered = false;
        if (handler) {
          try { recovered = await Promise.resolve(handler()); } catch { recovered = false; }
        }
        this.anticorpoHistory.push({
          timestamp: Date.now(),
          targetModule: moduleId,
          anomalyType: 'state_drift',
          action: recovered ? 'corrected' : 'bypassed',
          severity: diag.errorRate,
          details: recovered
            ? 'Recovery handler executado e reportado como aplicado.'
            : 'Nenhum executor observado; diagnóstico preservado sem mutação sintética.',
        });
        if (recovered) this._inconsistenciesResolved++;
      }

      if (diag.memoryUsage > 0.85) {
        const handler = this.recoveryHandlers.get(moduleId);
        let recovered = false;
        if (handler) {
          try { recovered = await Promise.resolve(handler()); } catch { recovered = false; }
        }
        this.anticorpoHistory.push({
          timestamp: Date.now(),
          targetModule: moduleId,
          anomalyType: 'memory_leak',
          action: recovered ? 'corrected' : 'bypassed',
          severity: diag.memoryUsage,
          details: recovered
            ? 'Recovery handler executado e reportado como aplicado.'
            : 'Sem executor de recuperação de memória; nenhum valor foi falsamente reduzido.',
        });
        if (recovered) this._inconsistenciesResolved++;
      }

      if (diag.loopDetected) {
        const handler = this.recoveryHandlers.get(moduleId);
        let recovered = false;
        if (handler) {
          try { recovered = await Promise.resolve(handler()); } catch { recovered = false; }
        }
        this.anticorpoHistory.push({
          timestamp: Date.now(),
          targetModule: moduleId,
          anomalyType: 'loop_detected',
          action: recovered ? 'restarted' : 'bypassed',
          severity: 0.8,
          details: recovered
            ? 'Recovery handler executado para o loop detectado.'
            : 'Somente o detector foi resetado; restart do runtime não foi executado.',
        });
        this.patternBuffer.set(moduleId, []);
        diag.loopDetected = false;
        if (recovered) this._inconsistenciesResolved++;
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
          details: moduleId + ' marcado criticamente insalubre; isolamento efetivo depende de executor autorizado.',
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
        if (Math.abs(d1.errorRate - d2.errorRate) > 0.5) {
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
  private computeStateHash(health: { cpuLoad: number; memoryUsage: number; errorRate: number }): number {
    return Math.round(health.cpuLoad * 100) * 10000 +
           Math.round(health.memoryUsage * 100) * 100 +
           Math.round(health.errorRate * 100);
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
