/**
 * hortaCore — memória central do Aeternum.
 * Não é persistência de disco. É estado em memória com observadores.
 * Complementa (não substitui) qualquer store já existente no N01.
 */

type ObserverCallback = (value: any) => void;
type Unsubscribe = () => void;

interface ChangeEntry {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

class HortaCore {
  private data: Map<string, any> = new Map();
  private observers: Map<string, ObserverCallback[]> = new Map();
  private changeLog: ChangeEntry[] = [];
  private readonly maxLog = 1000;

  set(key: string, value: any): void {
    const oldValue = this.data.get(key);
    this.data.set(key, value);
    this.changeLog.push({ key, oldValue, newValue: value, timestamp: Date.now() });
    if (this.changeLog.length > this.maxLog) this.changeLog.shift();

    const subs = this.observers.get(key);
    if (subs) {
      for (const cb of subs) {
        try { cb(value); } catch (e) {
          console.error(`[hortaCore] observer error em "${key}"`, e);
        }
      }
    }
  }

  get<T = any>(key: string): T | undefined { return this.data.get(key); }
  has(key: string): boolean { return this.data.has(key); }
  delete(key: string): void { this.data.delete(key); }

  observe(key: string, cb: ObserverCallback): Unsubscribe {
    if (!this.observers.has(key)) this.observers.set(key, []);
    this.observers.get(key)!.push(cb);
    return () => {
      const arr = this.observers.get(key);
      if (!arr) return;
      const i = arr.indexOf(cb);
      if (i > -1) arr.splice(i, 1);
    };
  }

  keys(): string[] { return Array.from(this.data.keys()); }
  dump(): Record<string, any> { return Object.fromEntries(this.data); }
  clear(): void { this.data.clear(); this.observers.clear(); this.changeLog = []; }
}

export const hortaCore = new HortaCore();
