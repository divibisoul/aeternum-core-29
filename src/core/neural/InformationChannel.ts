/**
 * INFORMATION CHANNEL - Canal de Comunicação
 * 
 * Implementa conexões entre nós de processamento
 */

import { EventBus } from '../EventBus';
import type { InformationPacket, NodeLevel } from './types';

/**
 * Canal de informação entre nós
 */
export class InformationChannel {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly targetLevel: NodeLevel;
  
  private _active = true;
  private bandwidth = 1.0;
  private latency = 0;
  private packetsTransmitted = 0;
  private errorCount = 0;
  private packetQueue: InformationPacket[] = [];
  private maxQueueSize = 50;

  constructor(
    sourceId: string,
    targetId: string,
    targetLevel: NodeLevel,
    bandwidth: number = 1.0
  ) {
    this.id = `ch_${sourceId}_${targetId}`;
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.targetLevel = targetLevel;
    this.bandwidth = bandwidth;

    EventBus.emit('module:registered', {
      id: this.id,
      name: `Channel: ${sourceId} → ${targetId}`,
    });
  }

  get active(): boolean {
    return this._active;
  }

  /**
   * Transmite um pacote através do canal
   */
  transmit(packet: InformationPacket): boolean {
    if (!this._active) {
      this.errorCount++;
      console.warn(`[InformationChannel] Canal ${this.id} inativo`);
      return false;
    }

    // Simular latência baseada em bandwidth
    this.latency = Math.round((1 / this.bandwidth) * 10);

    // Verificar capacidade da fila
    if (this.packetQueue.length >= this.maxQueueSize) {
      // Descartar pacote mais antigo se menos crítico
      const leastCritical = this.packetQueue.reduce((min, p) => 
        p.criticality < min.criticality ? p : min
      );
      
      if (packet.criticality > leastCritical.criticality) {
        this.packetQueue = this.packetQueue.filter(p => p.id !== leastCritical.id);
        this.packetQueue.push(packet);
      } else {
        this.errorCount++;
        return false;
      }
    } else {
      this.packetQueue.push(packet);
    }

    this.packetsTransmitted++;
    return true;
  }

  /**
   * Recupera próximo pacote da fila (FIFO com prioridade)
   */
  receive(): InformationPacket | null {
    if (this.packetQueue.length === 0) return null;

    // Ordenar por criticidade e pegar o mais crítico
    this.packetQueue.sort((a, b) => b.criticality - a.criticality);
    return this.packetQueue.shift() || null;
  }

  /**
   * Verifica se há pacotes pendentes
   */
  hasPendingPackets(): boolean {
    return this.packetQueue.length > 0;
  }

  /**
   * Ativa/desativa o canal
   */
  setActive(active: boolean): void {
    this._active = active;
    console.log(`[InformationChannel] ${this.id} ${active ? 'ativado' : 'desativado'}`);
  }

  /**
   * Ajusta bandwidth
   */
  setBandwidth(bandwidth: number): void {
    this.bandwidth = Math.max(0.1, Math.min(10.0, bandwidth));
  }

  /**
   * Retorna métricas do canal
   */
  getMetrics(): {
    id: string;
    active: boolean;
    bandwidth: number;
    latency: number;
    packetsTransmitted: number;
    errorCount: number;
    queueSize: number;
  } {
    return {
      id: this.id,
      active: this._active,
      bandwidth: this.bandwidth,
      latency: this.latency,
      packetsTransmitted: this.packetsTransmitted,
      errorCount: this.errorCount,
      queueSize: this.packetQueue.length,
    };
  }
}
