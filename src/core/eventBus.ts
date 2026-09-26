/**
 * nervoVago — fachada de observabilidade sobre o EventBus REAL do N01.
 * NÃO é um segundo bus. NÃO substitui src/core/EventBus.ts.
 * Compõe: delega publicação/assinatura ao EventBus real e mantém
 * histórico em memória para auditoria.
 */

import { EventBus as RealEventBus } from './EventBus';

type Listener = (data: any) => void;
type Unsubscribe = () => void;

interface HistoryEntry {
  event: string;
  data: any;
  timestamp: number;
}

class NervoVagoFacade {
  private history: HistoryEntry[] = [];
  private readonly maxHistory = 1000;
  private readonly bus: any;

  constructor(bus: any) {
    this.bus = bus;
  }

  emit(event: string, data?: any): void {
    this.history.push({ event, data, timestamp: Date.now() });
    if (this.history.length > this.maxHistory) this.history.shift();
    if (typeof this.bus.publish === 'function') this.bus.publish(event, data);
    else if (typeof this.bus.emit === 'function') this.bus.emit(event as never, data);
    else throw new Error('EventBus real não expõe publish/emit');
  }

  on(event: string, listener: Listener): Unsubscribe {
    if (typeof this.bus.subscribe === 'function') {
      const unsub = this.bus.subscribe(event, listener);
      return typeof unsub === 'function' ? unsub : () => this.bus.unsubscribe?.(event, listener);
    }
    if (typeof this.bus.on === 'function') {
      const unsub = this.bus.on(event as never, listener as never);
      return typeof unsub === 'function' ? unsub : () => this.bus.off?.(event as never);
    }
    throw new Error('EventBus real não expõe subscribe/on');
  }

  off(event: string, listener: Listener): void {
    if (typeof this.bus.unsubscribe === 'function') this.bus.unsubscribe(event, listener);
    else if (typeof this.bus.off === 'function') this.bus.off(event, listener);
  }

  getHistory(): HistoryEntry[] { return [...this.history]; }

  getRegisteredEvents(): string[] {
    if (typeof this.bus.listenerCount === 'function') {
      return Array.from(new Set(this.history.map(h => h.event)));
    }
    return Array.from(new Set(this.history.map(h => h.event)));
  }
}

const realBus = RealEventBus;

export const nervoVago = new NervoVagoFacade(realBus);
