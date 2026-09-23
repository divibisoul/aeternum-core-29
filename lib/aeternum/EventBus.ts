import type { AeternumEvent } from "./AeternumTypes";

type Listener<T = unknown> = (data: T) => void | Promise<void>;
type Unsubscribe = () => void;

export class AeternumEventBus {
  private readonly listeners = new Map<string, Set<Listener<unknown>>>();
  private readonly history: AeternumEvent[] = [];
  private sequence = 0;

  constructor(private readonly maxHistory = 2000) {}

  on<T>(event: string, listener: Listener<T>): Unsubscribe {
    const listeners = this.listeners.get(event) ?? new Set<Listener<unknown>>();
    listeners.add(listener as Listener<unknown>);
    this.listeners.set(event, listeners);
    return () => this.off(event, listener);
  }

  once<T>(event: string, listener: Listener<T>): Unsubscribe {
    let unsubscribe: Unsubscribe = () => undefined;
    unsubscribe = this.on<T>(event, async (data) => {
      unsubscribe();
      await listener(data);
    });
    return unsubscribe;
  }

  off<T>(event: string, listener: Listener<T>): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    listeners.delete(listener as Listener<unknown>);
    if (listeners.size === 0) this.listeners.delete(event);
  }

  async emit<T>(event: string, data: T): Promise<number> {
    const record: AeternumEvent<T> = {
      event,
      data,
      timestamp: Date.now(),
      sequence: ++this.sequence,
    };
    this.history.push(record as AeternumEvent);
    if (this.history.length > this.maxHistory) this.history.shift();

    const listeners = [...(this.listeners.get(event) ?? [])];
    await Promise.all(listeners.map(listener => Promise.resolve(listener(data))));
    return listeners.length;
  }

  getHistory(): AeternumEvent[] {
    return [...this.history];
  }

  getRegisteredEvents(): string[] {
    return [...this.listeners.keys()].sort();
  }
}

export const aeternumBus = new AeternumEventBus();
