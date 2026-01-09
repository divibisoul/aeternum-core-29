/**
 * HOMEOSTASIS MANAGER - Sistema de Regulação Global
 * 
 * Implementação CRÍTICA do HomeostasisManager
 * Gerencia stress global, modo turbo e recuperação de nós
 */

import { EventBus } from '../EventBus';
import type { ProcessingNode } from './ProcessingNode';
import {
  type NodeState,
  type HomeostasisReport,
  THERMAL_STRESS_WARN,
  TURBO_MAX_STRESS,
  TURBO_COOLDOWN_SECONDS,
  TURBO_DURATION_SECONDS,
  TURBO_PROCESSING_MULTIPLIER,
  RECOVERY_STRESS_THRESHOLD,
  RECOVERY_CHANCE_PER_CHECK,
  HOMEOSTASIS_CHECK_INTERVAL,
} from './types';

/**
 * HomeostasisManager - Sistema de regulação global
 */
export class HomeostasisManager {
  private nodeStates: Map<string, NodeState> = new Map();
  private allNodes: ProcessingNode[] = [];
  
  private globalStress = 0;
  private turboActive = false;
  private lastTurboActivation = 0;
  
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private _running = false;

  // Histórico para análise
  private stressHistory: number[] = [];
  private turboActivations = 0;
  private nodesRecovered = 0;

  constructor() {
    EventBus.emit('module:registered', {
      id: 'homeostasis-manager',
      name: 'HomeostasisManager',
    });

    console.log('[HomeostasisManager] Inicializado');
  }

  /**
   * Registra nós para monitoramento
   */
  registerNodes(nodes: ProcessingNode[]): void {
    this.allNodes = nodes;
    
    // Configurar callback em cada nó
    for (const node of nodes) {
      node.setHomeostasisCallback((state: NodeState) => {
        this.nodeStates.set(state.nodeId, state);
      });
    }

    console.log(`[HomeostasisManager] ${nodes.length} nós registrados`);
  }

  /**
   * Inicia o monitoramento
   */
  start(): void {
    if (this._running) return;

    this._running = true;
    this.checkInterval = setInterval(() => {
      this.collectReports();
      this.calculateGlobalStress();
      this.applyRegulation();
    }, HOMEOSTASIS_CHECK_INTERVAL);

    console.log('[HomeostasisManager] Monitoramento iniciado');
  }

  /**
   * Para o monitoramento
   */
  stop(): void {
    this._running = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    console.log('[HomeostasisManager] Monitoramento parado');
  }

  /**
   * Coleta relatórios de estado
   */
  private collectReports(): void {
    // Os estados são coletados automaticamente via callback
    // Este método pode ser usado para limpeza de estados antigos
    const now = Date.now();
    const staleThreshold = 10000; // 10 segundos

    for (const [nodeId, state] of this.nodeStates.entries()) {
      if (now - state.timestamp > staleThreshold) {
        console.warn(`[HomeostasisManager] Estado obsoleto de ${nodeId}`);
      }
    }
  }

  /**
   * Calcula stress global do sistema
   */
  private calculateGlobalStress(): void {
    let totalStress = 0;

    for (const state of this.nodeStates.values()) {
      // Fatores de estresse individual
      const loadStress = Math.max(0, state.loadRatio - 0.8) * 10; // >80% carga
      const thermalStress = Math.max(0, state.temperature - THERMAL_STRESS_WARN) * 2;
      totalStress += loadStress + thermalStress;
    }

    // Adicionar stress por nós inativos
    const inactiveNodes = this.allNodes.filter(node => !node.active).length;
    totalStress += inactiveNodes * 5.0;

    this.globalStress = totalStress;
    this.stressHistory.push(totalStress);

    // Manter histórico limitado
    if (this.stressHistory.length > 100) {
      this.stressHistory.shift();
    }

    // Emitir evento de telemetria
    EventBus.emit('telemetry:update', {
      latencyMs: 0,
      tokensPerSecond: 0,
      activeModules: this.allNodes.filter(n => n.active).length,
      memoryUsage: this.globalStress,
      uptime: Date.now(),
    });
  }

  /**
   * Aplica regulação homeostática
   */
  private applyRegulation(): void {
    const currentTime = Date.now();

    // ======= MODO TURBO =======
    const turboConditions = (
      this.globalStress < TURBO_MAX_STRESS &&
      (currentTime - this.lastTurboActivation) / 1000 > TURBO_COOLDOWN_SECONDS
    );

    if (turboConditions && !this.turboActive) {
      // ATIVAR MODO TURBO
      console.log('[HomeostasisManager] ⚡ ATIVANDO MODO TURBO');
      this.turboActive = true;
      this.lastTurboActivation = currentTime;
      this.turboActivations++;

      for (const node of this.allNodes) {
        if (node.active) {
          node.processingRateMultiplier *= TURBO_PROCESSING_MULTIPLIER;
        }
      }

      EventBus.emit('system:ready', { modules: ['turbo-mode-active'] });
    } else if (
      this.turboActive && 
      (currentTime - this.lastTurboActivation) / 1000 > TURBO_DURATION_SECONDS
    ) {
      // DESATIVAR MODO TURBO
      console.log('[HomeostasisManager] ⚡ DESATIVANDO MODO TURBO');
      this.turboActive = false;

      for (const node of this.allNodes) {
        node.processingRateMultiplier /= TURBO_PROCESSING_MULTIPLIER;
      }
    }

    // ======= RECUPERAÇÃO DE NÓS =======
    if (this.globalStress < RECOVERY_STRESS_THRESHOLD) {
      for (const node of this.allNodes) {
        if (!node.active && Math.random() < RECOVERY_CHANCE_PER_CHECK) {
          console.log(`[HomeostasisManager] Reativando nó ${node.id}`);
          node.setActive(true);
          this.nodesRecovered++;
        }
      }
    }

    // ======= THROTTLING DE EMERGÊNCIA =======
    if (this.globalStress > TURBO_MAX_STRESS * 2) {
      console.warn('[HomeostasisManager] ⚠️ STRESS CRÍTICO - Throttling ativo');
      
      for (const node of this.allNodes) {
        node.processingRateMultiplier *= 0.9;
      }
    }
  }

  /**
   * Retorna relatório completo
   */
  getReport(): HomeostasisReport {
    return {
      globalStress: this.globalStress,
      turboActive: this.turboActive,
      nodeStates: new Map(this.nodeStates),
      inactiveNodes: this.allNodes.filter(n => !n.active).length,
      timestamp: Date.now(),
    };
  }

  /**
   * Retorna métricas do sistema
   */
  getMetrics(): {
    globalStress: number;
    turboActive: boolean;
    turboActivations: number;
    nodesRecovered: number;
    activeNodes: number;
    totalNodes: number;
    avgStress: number;
  } {
    const avgStress = this.stressHistory.length > 0
      ? this.stressHistory.reduce((a, b) => a + b, 0) / this.stressHistory.length
      : 0;

    return {
      globalStress: this.globalStress,
      turboActive: this.turboActive,
      turboActivations: this.turboActivations,
      nodesRecovered: this.nodesRecovered,
      activeNodes: this.allNodes.filter(n => n.active).length,
      totalNodes: this.allNodes.length,
      avgStress,
    };
  }

  get running(): boolean {
    return this._running;
  }
}

// Singleton instance
export const homeostasisManager = new HomeostasisManager();
