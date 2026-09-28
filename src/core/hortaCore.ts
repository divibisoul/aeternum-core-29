/**
 * hortaCore — memória central de estado do Aeternum.
 * Não é persistência de disco. É estado em memória com observadores.
 * Complementa (não substitui) qualquer store já existente no N01.
 *
 * A mudança registrada aqui é funcional: além do valor atual, cada alteração
 * recebe uma sequência monotônica e entra no changelog para rastreabilidade.
 */

export interface HortaChange {
  key: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
  sequence: number;
}

type ObserverCallback = (value: unknown, change: HortaChange) => void;
type Unsubscribe = () => void;

export class HortaCore {
  private readonly data = new Map<string, unknown>();
  private readonly observers = new Map<string, ObserverCallback[]>();
  private readonly allObservers = new Set<(change: HortaChange) => void>();
  private readonly changeLog: HortaChange[] = [];
  private readonly maxLog = 1000;
  private sequence = 0;

  set<T>(key: string, value: T): HortaChange {
    const change: HortaChange = {
      key,
      oldValue: this.data.get(key),
      newValue: value,
      timestamp: Date.now(),
      sequence: ++this.sequence,
    };

    this.data.set(key, value);
    this.changeLog.push(change);
    if (this.changeLog.length > this.maxLog) this.changeLog.shift();

    for (const observer of [...(this.observers.get(key) ?? [])]) {
      try {
        observer(value, change);
      } catch (error) {
        console.error(`[hortaCore] observer error em "${key}"`, error);
      }
    }

    for (const observer of [...this.allObservers]) {
      try {
        observer(change);
      } catch (error) {
        console.error('[hortaCore] global observer error', error);
      }
    }

    return change;
  }

  get<T = unknown>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  delete(key: string): void {
    this.data.delete(key);
  }

  observe(key: string, cb: ObserverCallback): Unsubscribe {
    const observers = this.observers.get(key) ?? [];
    observers.push(cb);
    this.observers.set(key, observers);

    return () => {
      const current = this.observers.get(key);
      if (!current) return;
      const index = current.indexOf(cb);
      if (index >= 0) current.splice(index, 1);
      if (current.length === 0) this.observers.delete(key);
    };
  }

  observeAll(cb: (change: HortaChange) => void): Unsubscribe {
    this.allObservers.add(cb);
    return () => this.allObservers.delete(cb);
  }

  keys(): string[] {
    return [...this.data.keys()].sort();
  }

  snapshot(): Record<string, unknown> {
    return Object.fromEntries(this.data.entries());
  }

  getChangeLog(): HortaChange[] {
    return [...this.changeLog];
  }

  clear(): void {
    this.data.clear();
    this.observers.clear();
    this.allObservers.clear();
    this.changeLog.length = 0;
    this.sequence = 0;
  }
}

export const hortaCore = new HortaCore();
