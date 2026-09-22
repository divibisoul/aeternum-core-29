/**
 * HOMEOSTASIS MANAGER - Regulação global da Clareira.
 *
 * Mantém stress, energia operacional, turbo, throttling e recuperação.
 * O Nervo Vago é o canal autonômico; esta classe continua sendo a autoridade
 * de regulação da Clareira no runtime SOUL.
 */
import { EventBus } from '../EventBus';
import type { ProcessingNode } from './ProcessingNode';
import type { VagusNerve } from './VagusNerve';
import {
  type NodeState,
  type HomeostasisReport,
  type VagalSignal,
  THERMAL_STRESS_WARN,
  TURBO_MAX_STRESS,
  TURBO_COOLDOWN_SECONDS,
  TURBO_DURATION_SECONDS,
  TURBO_PROCESSING_MULTIPLIER,
  RECOVERY_STRESS_THRESHOLD,
  HOMEOSTASIS_CHECK_INTERVAL,
} from './types';

export class HomeostasisManager {
  private nodeStates: Map<string, NodeState> = new Map();
  private allNodes: ProcessingNode[] = [];
  private globalStress = 0;
  private energyScore = 100;
  private turboActive = false;
  private lastTurboActivation = 0;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private _running = false;
  private stressHistory: number[] = [];
  private turboActivations = 0;
  private nodesRecovered = 0;
  private vagus: VagusNerve | null = null;

  constructor() {
    EventBus.emit('module:registered', {
      id: 'homeostasis-manager',
      name: 'HomeostasisManager',
    });
  }

  registerNodes(nodes: ProcessingNode[]): void {
    this.allNodes = [...nodes];
    for (const node of this.allNodes) {
      node.setHomeostasisCallback((state: NodeState) => {
        this.nodeStates.set(state.nodeId, state);
      });
    }
  }

  attachVagus(vagus: VagusNerve): void {
    this.vagus = vagus;
  }

  receiveVagalAfferent(signal: VagalSignal): void {
    const node = this.allNodes.find(item => item.id === signal.sourceNodeId);
    if (!node) return;

    if (signal.signalType === 'thermal_critical') {
      this.vagus?.sendEfferent(node.id, 'reduce_thermal', signal.payload, 0.95);
    } else if (signal.signalType === 'overload' || signal.signalType === 'energy_low') {
      this.vagus?.sendEfferent(node.id, 'calm', signal.payload, 0.85);
    } else if (signal.signalType === 'fault') {
      this.globalStress = Math.min(100, this.globalStress + signal.priority);
    }
  }

  start(): void {
    if (this.checkInterval) return;
    this._running = true;
    if (this.lastTurboActivation === 0) this.lastTurboActivation = Date.now();

    this.checkInterval = setInterval(() => {
      this.collectReports();
      this.calculateGlobalStress();
      this.applyRegulation();
    }, HOMEOSTASIS_CHECK_INTERVAL);
  }

  stop(): void {
    this._running = false;
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = null;
    this.turboActive = false;
    for (const node of this.allNodes) {
      node.setHomeostasisMultiplier(1);
      node.setVagalMultiplier(1);
    }
  }

  private collectReports(): void {
    const now = Date.now();
    for (const [nodeId, state] of this.nodeStates.entries()) {
      if (now - state.timestamp > 10000) {
        EventBus.emit('telemetry:update', {
          nodeId,
          stale: true,
          timestamp: now,
        });
      }
    }
  }

  private calculateGlobalStress(): void {
    if (this.nodeStates.size === 0) {
      this.globalStress = 0.5;
      this.energyScore = 100;
      return;
    }

    let totalStress = 0;
    let totalEnergy = 0;
    let activeCount = 0;

    for (const state of this.nodeStates.values()) {
      if (!state.active) continue;
      const loadStress = Math.max(0, state.loadRatio - 0.8) * 10;
      const thermalStress = Math.max(0, state.temperature - THERMAL_STRESS_WARN) * 4;
      const queueStress = 0;
      totalStress += loadStress + thermalStress + queueStress;
      totalEnergy += state.loadRatio;
      activeCount += 1;
    }

    const inactive = this.allNodes.length - activeCount;
    totalStress += Math.max(0, inactive) * 2;

    this.globalStress = Math.min(100, totalStress);
    this.energyScore = activeCount > 0
      ? Math.max(0, Math.min(100, (totalEnergy / activeCount) * 100))
      : 0;

    this.stressHistory.push(this.globalStress);
    if (this.stressHistory.length > 100) this.stressHistory.shift();

    EventBus.emit('telemetry:update', {
      latencyMs: 0,
      tokensPerSecond: 0,
      activeModules: activeCount,
      memoryUsage: this.globalStress,
      energyScore: this.energyScore,
      uptime: Date.now(),
    });
  }

  private applyRegulation(): void {
    const now = Date.now();

    if (this.globalStress >= TURBO_MAX_STRESS * 2) {
      this.turboActive = false;
      for (const node of this.allNodes) {
        if (node.level === 'Secondary') {
          node.setHomeostasisMultiplier(0.35);
        } else {
          node.setHomeostasisMultiplier(0.55);
        }
        this.vagus?.sendEfferent(node.id, node.level === 'Central' ? 'calm' : 'reduce_thermal', {}, 1);
      }
    } else if (this.globalStress >= TURBO_MAX_STRESS) {
      this.turboActive = false;
      for (const node of this.allNodes) {
        node.setHomeostasisMultiplier(0.6);
        this.vagus?.sendEfferent(node.id, 'calm', {}, 0.85);
      }
    } else {
      const turboReady =
        !this.turboActive &&
        now - this.lastTurboActivation >= TURBO_COOLDOWN_SECONDS * 1000 &&
        this.energyScore >= 70 &&
        this.globalStress < TURBO_MAX_STRESS;

      if (turboReady) {
        this.turboActive = true;
        this.lastTurboActivation = now;
        this.turboActivations += 1;
        for (const node of this.allNodes) {
          node.setHomeostasisMultiplier(TURBO_PROCESSING_MULTIPLIER);
          node.setVagalMultiplier(1);
        }
      }

      if (this.turboActive && now - this.lastTurboActivation >= TURBO_DURATION_SECONDS * 1000) {
        this.turboActive = false;
        this.lastTurboActivation = now;
        for (const node of this.allNodes) node.setHomeostasisMultiplier(1);
      }

      if (!this.turboActive) {
        for (const node of this.allNodes) node.setHomeostasisMultiplier(1);
      }
    }

    if (this.globalStress < RECOVERY_STRESS_THRESHOLD) {
      for (const node of this.allNodes) {
        const inactiveSince = node.getInactiveSince();
        if (!node.active && inactiveSince > 0 && now - inactiveSince >= 10_000) {
          node.applyVagalCommand('resume', {});
          this.nodesRecovered += 1;
          this.lastTurboActivation = now;
        }
      }
    }
  }

  getReport(): HomeostasisReport {
    return {
      globalStress: this.globalStress,
      turboActive: this.turboActive,
      nodeStates: new Map(this.nodeStates),
      inactiveNodes: this.allNodes.filter(node => !node.active).length,
      timestamp: Date.now(),
    };
  }

  getMetrics() {
    const avgStress = this.stressHistory.length
      ? this.stressHistory.reduce((a, b) => a + b, 0) / this.stressHistory.length
      : 0;

    return {
      globalStress: this.globalStress,
      energyScore: this.energyScore,
      turboActive: this.turboActive,
      turboActivations: this.turboActivations,
      nodesRecovered: this.nodesRecovered,
      activeNodes: this.allNodes.filter(node => node.active).length,
      totalNodes: this.allNodes.length,
      avgStress,
      running: this._running,
    };
  }

  get running(): boolean {
    return this._running;
  }
}

export const homeostasisManager = new HomeostasisManager();
