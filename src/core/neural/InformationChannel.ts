/**
 * INFORMATION CHANNEL - Canal de Comunicação
 *
 * Canal FIFO com prioridade por criticidade e métricas de transporte.
 */
import { EventBus } from '../EventBus';
import type { InformationPacket, NodeLevel } from './types';

export class InformationChannel {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly targetLevel: NodeLevel;

  private _active = true;
  private bandwidth: number;
  private latency = 0;
  private packetsTransmitted = 0;
  private packetsReceived = 0;
  private errorCount = 0;
  private packetQueue: InformationPacket[] = [];
  private readonly maxQueueSize: number;

  constructor(
    sourceId: string,
    targetId: string,
    targetLevel: NodeLevel,
    bandwidth = 1.0,
    maxQueueSize = 50,
  ) {
    if (!sourceId || !targetId) throw new Error('CHANNEL_ENDPOINT_REQUIRED');
    if (maxQueueSize < 1) throw new Error('CHANNEL_QUEUE_SIZE_INVALID');
    this.id = `ch_${sourceId}_${targetId}`;
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.targetLevel = targetLevel;
    this.bandwidth = Math.max(0.1, Math.min(10, bandwidth));
    this.maxQueueSize = maxQueueSize;

    EventBus.emit('module:registered', {
      id: this.id,
      name: `Channel: ${sourceId} → ${targetId}`,
    });
  }

  get active(): boolean {
    return this._active;
  }

  transmit(packet: InformationPacket): boolean {
    if (!this._active || packet.sourceId !== this.sourceId) {
      this.errorCount += 1;
      return false;
    }

    this.latency = Math.max(1, Math.round(10 / this.bandwidth));

    if (this.packetQueue.length >= this.maxQueueSize) {
      const leastCriticalIndex = this.packetQueue.reduce(
        (minIndex, current, index, all) =>
          current.criticality < all[minIndex].criticality ? index : minIndex,
        0,
      );
      if (packet.criticality <= this.packetQueue[leastCriticalIndex].criticality) {
        this.errorCount += 1;
        return false;
      }
      this.packetQueue.splice(leastCriticalIndex, 1);
    }

    this.packetQueue.push(packet);
    this.packetsTransmitted += 1;
    return true;
  }

  receive(): InformationPacket | null {
    if (!this._active || this.packetQueue.length === 0) return null;
    this.packetQueue.sort((a, b) => {
      if (b.criticality !== a.criticality) return b.criticality - a.criticality;
      return a.timestamp - b.timestamp;
    });
    this.packetsReceived += 1;
    return this.packetQueue.shift() ?? null;
  }

  hasPendingPackets(): boolean {
    return this.packetQueue.length > 0;
  }

  setActive(active: boolean): void {
    this._active = active;
  }

  setBandwidth(bandwidth: number): void {
    this.bandwidth = Math.max(0.1, Math.min(10, bandwidth));
  }

  getMetrics() {
    return {
      id: this.id,
      active: this._active,
      bandwidth: this.bandwidth,
      latency: this.latency,
      packetsTransmitted: this.packetsTransmitted,
      packetsReceived: this.packetsReceived,
      errorCount: this.errorCount,
      queueSize: this.packetQueue.length,
    };
  }
}
