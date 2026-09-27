export interface HortaChange {
  key: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
  sequence: number;
}

type Observer = (value: unknown, change: HortaChange) => void | Promise<void>;

export class AeternumHortaCore {
  private readonly data = new Map<string, unknown>();
  private readonly observers = new Map<string, Set<Observer>>();
  private readonly changes: HortaChange[] = [];
  private sequence = 0;

  constructor(private readonly maxChanges = 2000) {}

  set<T>(key: string, value: T): HortaChange {
    const change: HortaChange = {
      key,
      oldValue: this.data.get(key),
      newValue: value,
      timestamp: Date.now(),
      sequence: ++this.sequence,
    };
    this.data.set(key, value);
    this.changes.push(change);
    if (this.changes.length > this.maxChanges) this.changes.shift();

    const observers = [...(this.observers.get(key) ?? [])];
    for (const observer of observers) {
      void Promise.resolve(observer(value, change));
    }
    return change;
  }

  get<T>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  observe(key: string, observer: Observer): () => void {
    const observers = this.observers.get(key) ?? new Set<Observer>();
    observers.add(observer);
    this.observers.set(key, observers);
    return () => {
      const current = this.observers.get(key);
      if (!current) return;
      current.delete(observer);
      if (current.size === 0) this.observers.delete(key);
    };
  }

  keys(): string[] {
    return [...this.data.keys()].sort();
  }

  snapshot(): Record<string, unknown> {
    return Object.fromEntries(this.data.entries());
  }

  getChangeLog(): HortaChange[] {
    return [...this.changes];
  }
}

export const aeternumHortaCore = new AeternumHortaCore();
