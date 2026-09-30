import {
  HortaCore as CanonicalHortaCore,
  hortaCore as canonicalHortaCore,
  type HortaChange,
  type HortaVascularDirection,
  type HortaVascularHealth,
  type HortaVascularOutcome,
  type HortaVascularPulse,
  type HortaVessel,
} from "../../src/core/hortaCore";

export type { HortaChange, HortaVascularDirection, HortaVascularHealth, HortaVascularOutcome, HortaVascularPulse, HortaVessel };

type Observer = (value: unknown, change: HortaChange) => void | Promise<void>;

/**
 * Compatibility facade over the canonical N01 HortaCore.
 *
 * The legacy AETERNUM surface stays available, but it no longer owns an
 * independent state store. Vascular state and Mesh circulation therefore have
 * exactly one runtime authority.
 */
export class AeternumHortaCore {
  constructor(private readonly core: CanonicalHortaCore = canonicalHortaCore) {}

  set<T>(key: string, value: T): HortaChange {
    return this.core.set(key, value);
  }

  get<T>(key: string): T | undefined {
    return this.core.get<T>(key);
  }

  has(key: string): boolean {
    return this.core.has(key);
  }

  delete(key: string): void {
    this.core.delete(key);
  }

  observe(key: string, observer: Observer): () => void {
    return this.core.observe(key, observer as (value: unknown, change: HortaChange) => void);
  }

  observeAll(observer: (change: HortaChange) => void): () => void {
    return this.core.observeAll(observer);
  }

  keys(): string[] {
    return this.core.keys();
  }

  snapshot(): Record<string, unknown> {
    return this.core.snapshot();
  }

  getChangeLog(): HortaChange[] {
    return this.core.getChangeLog();
  }

  ensureVessel(
    source: string,
    target: string,
    options: {
      capacityBytes?: number;
      resistance?: number;
      direction?: HortaVascularDirection;
    } = {},
  ): HortaVessel {
    return this.core.ensureVessel(source, target, options);
  }

  getVessel(id: string): HortaVessel | undefined {
    return this.core.getVessel(id);
  }

  listVessels(): HortaVessel[] {
    return this.core.listVessels();
  }

  beginVascularPulse(input: {
    source: string;
    target: string;
    direction?: HortaVascularDirection;
    bytes: number;
    correlationId?: string;
    messageId?: string;
    kind?: string;
    capability?: string;
    capacityBytes?: number;
    resistance?: number;
  }): HortaVascularPulse {
    return this.core.beginVascularPulse(input);
  }

  completeVascularPulse(
    pulseId: string,
    outcome: Exclude<HortaVascularOutcome, "started" | "rejected">,
    error?: string,
  ): HortaVascularPulse | undefined {
    return this.core.completeVascularPulse(pulseId, outcome, error);
  }

  vascularHealth(): HortaVascularHealth {
    return this.core.vascularHealth();
  }

  getVascularFlowLog() {
    return this.core.getVascularFlowLog();
  }

  clear(): void {
    this.core.clear();
  }
}

export const aeternumHortaCore = new AeternumHortaCore();
