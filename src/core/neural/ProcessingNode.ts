/**
 * PROCESSING NODE - Nó de Processamento Neural
 *
 * Implementa filas de entrada reais, canais de entrada/saída, regulação
 * homeostática e interface aferente do Nervo Vago.
 */
import { EventBus } from '../EventBus';
import { InformationChannel } from './InformationChannel';
import {
  type InformationPacket,
  type NodeLevel,
  type NodeState,
  type VagalSignalType,
  type PacketType,
  createInformationPacket,
  THERMAL_STRESS_WARN,
  THERMAL_STRESS_CRITICAL,
  LEVEL_MAP,
  MAX_QUEUE_SIZE,
  REPORT_INTERVAL,
  PROCESS_TICK_INTERVAL,
} from './types';

export class ProcessingNode {
  readonly id: string;
  readonly level: NodeLevel;

  protected _active = true;
  protected currentEnergy = 100;
  protected energyCapacity = 100;
  protected thermalSensorReading = 0.3;

  private baseProcessingRateMultiplier = 1.0;
  private homeostasisMultiplier = 1.0;
  private vagalMultiplier = 1.0;

  protected inputQueue: InformationPacket[] = [];
  protected inputChannels: Map<string, InformationChannel> = new Map();
  protected outputChannels: Map<string, InformationChannel> = new Map();
  protected homeostasisReportCallback?: (report: NodeState) => void;
  protected vagusAfferentReporter?: (
    signalType: VagalSignalType,
    payload: Record<string, unknown>,
    priority?: number,
  ) => void;

  private processingInterval: ReturnType<typeof setInterval> | null = null;
  private reportInterval: ReturnType<typeof setInterval> | null = null;
  private packetsProcessed = 0;
  private lastProcessingTime = 0;
  private inactiveSince = 0;

  constructor(id: string, level: NodeLevel) {
    this.id = id;
    this.level = level;
    EventBus.emit('module:registered', {
      id: this.id,
      name: `ProcessingNode: ${id} (${level})`,
    });
  }

  get active(): boolean {
    return this._active;
  }

  get processingRateMultiplier(): number {
    return Math.max(0.05, Math.min(8, this.baseProcessingRateMultiplier * this.homeostasisMultiplier * this.vagalMultiplier));
  }

  set processingRateMultiplier(value: number) {
    const denominator = Math.max(0.05, this.homeostasisMultiplier * this.vagalMultiplier);
    this.baseProcessingRateMultiplier = Math.max(0.05, Math.min(8, value / denominator));
  }

  setHomeostasisMultiplier(value: number): void {
    this.homeostasisMultiplier = Math.max(0.1, Math.min(4, value));
  }

  setVagalMultiplier(value: number): void {
    this.vagalMultiplier = Math.max(0.1, Math.min(3, value));
  }

  setHomeostasisCallback(callback: (report: NodeState) => void): void {
    this.homeostasisReportCallback = callback;
  }

  setVagusAfferentReporter(
    reporter: (
      signalType: VagalSignalType,
      payload: Record<string, unknown>,
      priority?: number,
    ) => void,
  ): void {
    this.vagusAfferentReporter = reporter;
  }

  start(): void {
    if (this.processingInterval) return;
    this._active = true;

    this.processingInterval = setInterval(() => {
      if (this._active) this.processLoop();
    }, PROCESS_TICK_INTERVAL);

    this.reportInterval = setInterval(() => {
      if (this._active) this.reportStateToHomeostasis();
    }, REPORT_INTERVAL);
  }

  stop(): void {
    this._active = false;
    if (this.processingInterval) clearInterval(this.processingInterval);
    if (this.reportInterval) clearInterval(this.reportInterval);
    this.processingInterval = null;
    this.reportInterval = null;
  }

  setActive(active: boolean): void {
    if (active && !this._active) {
      this.inactiveSince = 0;
      this.start();
    } else if (!active && this._active) {
      this.inactiveSince = Date.now();
      this.stop();
      this.vagusAfferentReporter?.('fault', {
        nodeId: this.id,
        inactiveSince: this.inactiveSince,
      }, 0.9);
    }
  }

  getInactiveSince(): number {
    return this.inactiveSince;
  }

  addInputChannel(channel: InformationChannel): void {
    this.inputChannels.set(channel.sourceId, channel);
  }

  addOutputChannel(channel: InformationChannel): void {
    this.outputChannels.set(channel.targetId, channel);
  }

  receivePacket(packet: InformationPacket): boolean {
    if (!this._active) return false;
    if (this.inputQueue.length >= MAX_QUEUE_SIZE) {
      const leastCritical = this.inputQueue.reduce((min, p) =>
        p.criticality < min.criticality ? p : min
      );
      if (packet.criticality <= leastCritical.criticality) return false;
      this.inputQueue = this.inputQueue.filter(p => p.id !== leastCritical.id);
    }
    this.inputQueue.push(packet);
    return true;
  }

  protected pullFromChannels(): void {
    for (const channel of this.inputChannels.values()) {
      if (!channel.active) continue;
      let packet = channel.receive();
      while (packet && this.inputQueue.length < MAX_QUEUE_SIZE) {
        this.inputQueue.push(packet);
        packet = channel.receive();
      }
    }
  }

  protected reportStateToHomeostasis(): void {
    if (!this.homeostasisReportCallback || !this._active) return;

    const loadRatio = this.energyCapacity > 0 ? this.currentEnergy / this.energyCapacity : 0;
    const energyCriticality = 1 - loadRatio;
    const thermalCriticality = Math.max(
      0,
      (this.thermalSensorReading - THERMAL_STRESS_WARN) /
        Math.max(0.001, THERMAL_STRESS_CRITICAL - THERMAL_STRESS_WARN),
    );

    const report: NodeState = {
      nodeId: this.id,
      level: this.level,
      loadRatio,
      temperature: this.thermalSensorReading,
      active: this._active,
      processingRate: this.processingRateMultiplier,
      timestamp: Date.now(),
    };

    try {
      this.homeostasisReportCallback(report);
    } catch (error) {
      console.warn(`[ProcessingNode] ${this.id}: falha no report`, error);
    }

    EventBus.emit('telemetry:update', {
      latencyMs: this.lastProcessingTime,
      tokensPerSecond: this.packetsProcessed / (REPORT_INTERVAL / 1000),
      activeModules: this._active ? 1 : 0,
      memoryUsage: Math.max(0, Math.min(100, loadRatio * 100)),
      uptime: Date.now(),
      stateCriticality: Math.max(0.1, Math.min(1, (energyCriticality + thermalCriticality) / 2)),
    });
  }

  protected selectOutputChannel(packet: InformationPacket): InformationChannel | null {
    if (packet.destinationHint) {
      const direct = this.outputChannels.get(packet.destinationHint);
      if (direct?.active) return direct;
    }

    if (packet.packetType === 'StateReport' || packet.packetType === 'DecisionResponse') {
      for (const channel of this.outputChannels.values()) {
        if (channel.active && LEVEL_MAP[channel.targetLevel] === 0) return channel;
      }
    }

    if (packet.packetType === 'DecisionRequest') {
      let best: InformationChannel | null = null;
      let bestLevel = Infinity;
      for (const channel of this.outputChannels.values()) {
        if (channel.active && LEVEL_MAP[channel.targetLevel] < bestLevel) {
          best = channel;
          bestLevel = LEVEL_MAP[channel.targetLevel];
        }
      }
      if (best) return best;
    }

    for (const channel of this.outputChannels.values()) {
      if (channel.active) return channel;
    }
    return null;
  }

  protected processLoop(): void {
    this.pullFromChannels();
    if (this.inputQueue.length === 0) {
      this.regenerateEnergy(0.25);
      return;
    }

    const batchSize = Math.max(1, Math.min(8, Math.ceil(this.processingRateMultiplier)));
    this.inputQueue.sort((a, b) => b.criticality - a.criticality);

    for (let i = 0; i < batchSize && this.inputQueue.length > 0; i += 1) {
      const packet = this.inputQueue.shift();
      if (!packet) break;

      const startTime = Date.now();
      const result = this.nodeSpecificProcessing(packet);
      const cost = 0.5 + packet.data.length * 0.01 + packet.criticality;
      if (this.currentEnergy < cost) {
        this.inputQueue.unshift(packet);
        this.vagusAfferentReporter?.('energy_low', {
          energy: this.currentEnergy,
          required: cost,
        }, 0.9);
        break;
      }

      this.consumeEnergy(cost);
      this.updateTemperature(packet.criticality);

      if (result) {
        const responsePacket = createInformationPacket(
          result.data,
          packet.informationalValue * 0.9,
          result.criticality,
          result.packetType,
          this.id,
          result.destinationHint,
          result.metadata,
        );
        const channel = this.selectOutputChannel(responsePacket);
        if (channel) channel.transmit(responsePacket);
      }

      this.packetsProcessed += 1;
      this.lastProcessingTime = Date.now() - startTime;
      this.regenerateEnergy(0.1);
    }
  }

  protected nodeSpecificProcessing(_packet: InformationPacket): {
    data: string;
    packetType: PacketType;
    destinationHint?: string;
    criticality: number;
    metadata: Record<string, unknown>;
  } | null {
    return null;
  }

  protected consumeEnergy(amount: number): void {
    this.currentEnergy = Math.max(0, this.currentEnergy - Math.max(0, amount));
  }

  protected regenerateEnergy(amount: number): void {
    this.currentEnergy = Math.min(this.energyCapacity, this.currentEnergy + Math.max(0, amount));
  }

  protected updateTemperature(load: number): void {
    const cooling = this.homeostasisMultiplier < 1 ? 0.02 : 0.01;
    this.thermalSensorReading = Math.max(
      0.1,
      Math.min(1, this.thermalSensorReading + load * 0.015 - cooling),
    );

    if (this.thermalSensorReading >= THERMAL_STRESS_CRITICAL) {
      this.setHomeostasisMultiplier(0.5);
      this.vagusAfferentReporter?.('thermal_critical', {
        temperature: this.thermalSensorReading,
      }, 0.95);
    } else if (this.thermalSensorReading >= THERMAL_STRESS_WARN) {
      this.vagusAfferentReporter?.('health', {
        temperature: this.thermalSensorReading,
      }, 0.75);
    }
  }

  applyVagalCommand(
    command: 'calm' | 'turbo' | 'reduce_thermal' | 'shutdown' | 'resume',
    payload: Record<string, unknown> = {},
  ): void {
    switch (command) {
      case 'calm':
        this.setVagalMultiplier(0.7);
        break;
      case 'turbo':
        this.setVagalMultiplier(Number(payload.multiplier ?? 1.5));
        break;
      case 'reduce_thermal':
        this.setVagalMultiplier(0.5);
        this.thermalSensorReading = Math.max(0.1, this.thermalSensorReading - 0.05);
        break;
      case 'shutdown':
        if (this.level !== 'Central') this.setActive(false);
        break;
      case 'resume':
        this.setVagalMultiplier(1);
        this.setHomeostasisMultiplier(1);
        if (!this._active) this.setActive(true);
        break;
    }
  }

  getState(): NodeState {
    return {
      nodeId: this.id,
      level: this.level,
      loadRatio: this.energyCapacity > 0 ? this.currentEnergy / this.energyCapacity : 0,
      temperature: this.thermalSensorReading,
      active: this._active,
      processingRate: this.processingRateMultiplier,
      timestamp: Date.now(),
    };
  }

  getMetrics() {
    return {
      id: this.id,
      level: this.level,
      active: this._active,
      energy: this.currentEnergy,
      energyCapacity: this.energyCapacity,
      temperature: this.thermalSensorReading,
      processingRate: this.processingRateMultiplier,
      packetsProcessed: this.packetsProcessed,
      queueSize: this.inputQueue.length,
      inputChannels: this.inputChannels.size,
      outputChannels: this.outputChannels.size,
    };
  }
}
