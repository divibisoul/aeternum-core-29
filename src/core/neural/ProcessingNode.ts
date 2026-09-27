/**
 * PROCESSING NODE - Nó de Processamento Neural
 * 
 * Implementa ProcessingNode com _report_state_to_homeostasis e _select_output_channel
 */

import { EventBus } from '../EventBus';
import { InformationChannel } from './InformationChannel';
import {
  type InformationPacket,
  type NodeLevel,
  type NodeState,
  type PacketType,
  createInformationPacket,
  THERMAL_STRESS_WARN,
  THERMAL_STRESS_CRITICAL,
  LEVEL_MAP,
  MAX_QUEUE_SIZE,
  REPORT_INTERVAL,
  ENERGY_CAPACITY_BY_LEVEL,
} from './types';

/**
 * Nó de Processamento - Unidade básica de processamento neural
 */
export class ProcessingNode {
  readonly id: string;
  readonly level: NodeLevel;
  
  // Estado interno
  protected _active = true;
  protected currentEnergy = 100;
  protected energyCapacity = 100;
  protected thermalSensorReading = 0.3;
  protected _processingRateMultiplier = 1.0;
  private homeostasisMultiplier = 1.0;
  private vagalMultiplier = 1.0;
  
  // Filas
  protected inputQueue: InformationPacket[] = [];
  protected outputChannels: Map<string, InformationChannel> = new Map();
  protected inputChannels: Map<string, InformationChannel> = new Map();
  
  // Referência ao HomeostasisManager (será definida pelo setup)
  protected homeostasisReportCallback?: (report: NodeState) => void;
  
  // Controle de processamento
  private processingInterval: ReturnType<typeof setInterval> | null = null;
  private reportInterval: ReturnType<typeof setInterval> | null = null;
  private packetsProcessed = 0;
  private lastProcessingTime = 0;
  private inactiveSince = 0;
  protected vagusAfferentReporter?: (
    signalType: import('./types').VagalSignalType,
    payload: Record<string, unknown>,
    priority?: number
  ) => void;

  constructor(id: string, level: NodeLevel) {
    this.id = id;
    this.level = level;
    this.energyCapacity = ENERGY_CAPACITY_BY_LEVEL[level];
    this.currentEnergy = this.energyCapacity * 0.6;

    EventBus.emit('module:registered', {
      id: this.id,
      name: `ProcessingNode: ${id} (${level})`,
    });

    console.log(`[ProcessingNode] ${this.id} criado no nível ${level}`);
  }

  get active(): boolean {
    return this._active;
  }

  get processingRateMultiplier(): number {
    return Math.max(
      0.05,
      Math.min(
        8.0,
        this._processingRateMultiplier * this.homeostasisMultiplier * this.vagalMultiplier
      )
    );
  }

  set processingRateMultiplier(value: number) {
    this._processingRateMultiplier = Math.max(0.05, Math.min(8.0, value));
  }

  /**
   * Inicia o nó de processamento
   */
  start(): void {
    if (this.processingInterval) return;

    this._active = true;
    
    // Loop de processamento principal
    this.processingInterval = setInterval(() => {
      if (this._active) {
        this.processLoop();
      }
    }, 100);

    // Loop de report para homeostase
    this.reportInterval = setInterval(() => {
      if (this._active) {
        this.reportStateToHomeostasis();
      }
    }, REPORT_INTERVAL);

    console.log(`[ProcessingNode] ${this.id} iniciado`);
  }

  /**
   * Para o nó de processamento
   */
  stop(): void {
    this._active = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }

    console.log(`[ProcessingNode] ${this.id} parado`);
  }

  /**
   * Define se o nó está ativo
   */
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

  setVagusAfferentReporter(
    reporter: (
      signalType: import('./types').VagalSignalType,
      payload: Record<string, unknown>,
      priority?: number
    ) => void
  ): void {
    this.vagusAfferentReporter = reporter;
  }

  setHomeostasisMultiplier(multiplier: number): void {
    this.homeostasisMultiplier = Math.max(0.1, Math.min(4.0, multiplier));
  }

  setVagalMultiplier(multiplier: number): void {
    this.vagalMultiplier = Math.max(0.1, Math.min(3.0, multiplier));
  }

  applyVagalCommand(
    command: import('./types').VagalCommand['command'],
    payload: Record<string, unknown> = {}
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
        this.setVagalMultiplier(1.0);
        if (!this._active) this.setActive(true);
        break;
    }
  }

  addInputChannel(channel: InformationChannel): void {
    this.inputChannels.set(channel.sourceId, channel);
  }

  /**
   * Adiciona uma conexão de saída
   */
  addOutputChannel(channel: InformationChannel): void {
    this.outputChannels.set(channel.targetId, channel);
  }

  /**
   * Recebe um pacote para processamento
   */
  receivePacket(packet: InformationPacket): boolean {
    if (!this._active) return false;
    
    if (this.inputQueue.length >= MAX_QUEUE_SIZE) {
      // Descartar pacote menos crítico se necessário
      const leastCritical = this.inputQueue.reduce((min, p) => 
        p.criticality < min.criticality ? p : min
      );
      
      if (packet.criticality > leastCritical.criticality) {
        this.inputQueue = this.inputQueue.filter(p => p.id !== leastCritical.id);
        this.inputQueue.push(packet);
        return true;
      }
      return false;
    }
    
    this.inputQueue.push(packet);
    return true;
  }

  /**
   * Define callback para report de homeostase
   */
  setHomeostasisCallback(callback: (report: NodeState) => void): void {
    this.homeostasisReportCallback = callback;
  }

  /**
   * IMPLEMENTAÇÃO CRÍTICA: _report_state_to_homeostasis
   * 
   * Reporta estado para o HomeostasisManager
   */
  protected reportStateToHomeostasis(): void {
    if (!this.homeostasisReportCallback || !this._active) return;

    const loadRatio = this.currentEnergy > 0 
      ? this.currentEnergy / this.energyCapacity 
      : 0;
    
    // Calcular criticidade baseada em carga, energia e temperatura
    const energyCriticality = 1.0 - (this.currentEnergy / this.energyCapacity);
    const thermalCriticality = Math.max(
      0.0, 
      (this.thermalSensorReading - THERMAL_STRESS_WARN) / 
      (THERMAL_STRESS_CRITICAL - THERMAL_STRESS_WARN)
    );
    const stateCriticality = Math.max(
      0.1, 
      Math.min(1.0, (energyCriticality + thermalCriticality) / 2)
    );

    // Construir relatório
    const report: NodeState = {
      nodeId: this.id,
      level: this.level,
      loadRatio,
      temperature: this.thermalSensorReading,
      active: this._active,
      processingRate: this._processingRateMultiplier,
      timestamp: Date.now(),
    };

    // Enviar para HomeostasisManager
    try {
      this.homeostasisReportCallback(report);
    } catch (error) {
      console.warn(`[ProcessingNode] ${this.id}: Falha ao reportar estado:`, error);
    }

    // Emitir evento de telemetria
    EventBus.emit('telemetry:update', {
      latencyMs: this.lastProcessingTime,
      tokensPerSecond: this.packetsProcessed / (REPORT_INTERVAL / 1000),
      activeModules: this._active ? 1 : 0,
      memoryUsage: loadRatio * 100,
      uptime: Date.now(),
      stateCriticality,
      nodeId: this.id,
    });
  }

  /**
   * IMPLEMENTAÇÃO CRÍTICA: _select_output_channel
   * 
   * Seleciona canal de saída apropriado para um pacote
   */
  protected selectOutputChannel(packet: InformationPacket): InformationChannel | null {
    // 1. Tentar rota por hint
    if (packet.destinationHint) {
      const channel = this.outputChannels.get(packet.destinationHint);
      if (channel && channel.active) {
        return channel;
      }
    }

    // 2. Roteamento hierárquico padrão
    if (packet.packetType === 'StateReport' || packet.packetType === 'DecisionResponse') {
      // Enviar para nível superior (Central)
      for (const channel of this.outputChannels.values()) {
        if (LEVEL_MAP[channel.targetLevel] === 0 && channel.active) {
          return channel;
        }
      }
    }

    // 3. Broadcast para decisões
    if (packet.packetType === 'DecisionRequest') {
      // Enviar para nível mais alto disponível
      let bestChannel: InformationChannel | null = null;
      let bestLevel = Infinity;
      
      for (const channel of this.outputChannels.values()) {
        if (channel.active && LEVEL_MAP[channel.targetLevel] < bestLevel) {
          bestChannel = channel;
          bestLevel = LEVEL_MAP[channel.targetLevel];
        }
      }
      
      if (bestChannel) return bestChannel;
    }

    // 4. Fallback: primeiro canal disponível
    for (const channel of this.outputChannels.values()) {
      if (channel.active) {
        return channel;
      }
    }

    return null;
  }

  /**
   * Loop de processamento principal
   */
  protected processLoop(): void {
    for (const channel of this.inputChannels.values()) {
      if (!channel.active) continue;
      let incoming = channel.receive();
      while (incoming && this.inputQueue.length < MAX_QUEUE_SIZE) {
        this.inputQueue.push(incoming);
        incoming = channel.receive();
      }
    }

    if (this.inputQueue.length === 0) {
      this.currentEnergy = Math.min(this.energyCapacity, this.currentEnergy + 0.25);
      return;
    }

    const startTime = Date.now();

    // Ordenar por criticidade
    this.inputQueue.sort((a, b) => b.criticality - a.criticality);
    
    // Processar pacote mais crítico
    const batchSize = Math.max(1, Math.min(8, Math.ceil(this.processingRateMultiplier)));
    for (let processed = 0; processed < batchSize && this.inputQueue.length > 0; processed++) {
      const packet = this.inputQueue.shift();
      if (!packet) break;

      // Processamento específico do nó
      const result = this.nodeSpecificProcessing(packet);
      
      // Custo metabólico depende do tamanho e criticidade do pacote.
      this.consumeEnergy(
        packet.data.length * 0.008 * (1 + packet.criticality * 0.5)
      );
      
      // Atualizar temperatura
    this.updateTemperature(packet.criticality);

      // Se houver resultado, criar e enviar resposta
      if (result) {
        const responsePacket = createInformationPacket(
          result.data,
          packet.informationalValue * 0.9,
          result.criticality,
          result.packetType,
          this.id,
          result.destinationHint,
          result.metadata
        );

        const channel = this.selectOutputChannel(responsePacket);
        if (channel) {
          channel.transmit(responsePacket);
        }
      }

      this.packetsProcessed++;
    }

    this.lastProcessingTime = Date.now() - startTime;
  }

  /**
   * Processamento específico do nó (pode ser sobrescrito)
   */
  protected nodeSpecificProcessing(packet: InformationPacket): {
    data: string;
    packetType: PacketType;
    destinationHint?: string;
    criticality: number;
    metadata: Record<string, unknown>;
  } | null {
    // Implementação básica - apenas log
    console.log(`[ProcessingNode] ${this.id} processando pacote ${packet.packetType}`);
    return null;
  }

  /**
   * Consome energia baseado no processamento
   */
  protected consumeEnergy(amount: number): void {
    this.currentEnergy = Math.max(0, this.currentEnergy - Math.max(0, amount));

    if (this.currentEnergy / Math.max(1, this.energyCapacity) < 0.1) {
      this.vagusAfferentReporter?.('energy_low', {
        energy: this.currentEnergy,
        capacity: this.energyCapacity,
      }, 0.9);
    }
  }

  /**
   * Atualiza temperatura baseado no processamento
   */
  protected updateTemperature(load: number): void {
    // Aumentar com carga
    this.thermalSensorReading += load * 0.01;
    
    // Resfriar gradualmente
    this.thermalSensorReading *= 0.98;
    
    // Limitar
    this.thermalSensorReading = Math.max(0.1, Math.min(1.0, this.thermalSensorReading));

    // Verificar stress térmico
    if (this.thermalSensorReading >= THERMAL_STRESS_CRITICAL) {
      console.warn(`[ProcessingNode] ${this.id} em stress térmico crítico!`);
      this.setHomeostasisMultiplier(0.5); // Throttle via regulatory layer
      this.vagusAfferentReporter?.('thermal_critical', {
        temperature: this.thermalSensorReading,
      }, 0.95);
    } else if (this.thermalSensorReading >= THERMAL_STRESS_WARN) {
      console.warn(`[ProcessingNode] ${this.id} temperatura elevada`);
      this.vagusAfferentReporter?.('health', {
        temperature: this.thermalSensorReading,
      }, 0.75);
    }
  }

  /**
   * Retorna estado atual do nó
   */
  getState(): NodeState {
    return {
      nodeId: this.id,
      level: this.level,
      loadRatio: this.currentEnergy / this.energyCapacity,
      temperature: this.thermalSensorReading,
      active: this._active,
      processingRate: this._processingRateMultiplier,
      timestamp: Date.now(),
    };
  }

  /**
   * Retorna métricas do nó
   */
  getMetrics(): {
    id: string;
    level: NodeLevel;
    active: boolean;
    energy: number;
    temperature: number;
    processingRate: number;
    packetsProcessed: number;
    queueSize: number;
    outputChannels: number;
    inputChannels: number;
  } {
    return {
      id: this.id,
      level: this.level,
      active: this._active,
      energy: this.currentEnergy,
      temperature: this.thermalSensorReading,
      processingRate: this._processingRateMultiplier,
      packetsProcessed: this.packetsProcessed,
      queueSize: this.inputQueue.length,
      outputChannels: this.outputChannels.size,
      inputChannels: this.inputChannels.size,
    };
  }
}
