import {
  HortaCore as CanonicalHortaCore,
  hortaCore as canonicalHortaCore,
  type HortaChange,
  type HortaFunctionalLink,
  type HortaSynergisticFlow,
  type HortaVascularDirection,
  type HortaVascularHealth,
  type HortaVascularOutcome,
  type HortaVascularPulse,
  type HortaVessel,
} from '../../src/core/hortaCore';

export type {
  HortaChange,
  HortaFunctionalLink,
  HortaSynergisticFlow,
  HortaVascularDirection,
  HortaVascularHealth,
  HortaVascularOutcome,
  HortaVascularPulse,
  HortaVessel,
};

/**
 * Compatibility facade over the single canonical N01 HortaCore.
 *
 * The historical Aeternum API is preserved, but this facade owns no state.
 * There is one HortaCore authority for both state/memory and vascular flow.
 * Multiple references can exist for compatibility; they all point to the
 * same underlying organism.
 */
export class AeternumHortaCore {
  constructor(
    // Kept only for source compatibility with the historical constructor.
    // Retention is governed by the canonical HortaCore instance.
    _maxChanges = 2000,
    private readonly core: CanonicalHortaCore = canonicalHortaCore,
  ) {}

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
    return this.core.delete(key);
  }

  observe(
    key: string,
    observer: (value: unknown, change: HortaChange) => void,
  ): () => void {
    return this.core.observe(key, observer);
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

  ensureFunctionalLink(
    source: string,
    target: string,
    options: {
      role?: string;
      direction?: HortaVascularDirection;
      capacityBytes?: number;
      resistance?: number;
    } = {},
  ): HortaFunctionalLink {
    return this.core.ensureFunctionalLink(source, target, options);
  }

  getFunctionalLink(id: string): HortaFunctionalLink | undefined {
    return this.core.getFunctionalLink(id);
  }

  listFunctionalLinks(): HortaFunctionalLink[] {
    return this.core.listFunctionalLinks();
  }

  getVessel(id: string): HortaVessel | undefined {
    return this.core.getVessel(id);
  }

  listVessels(): HortaVessel[] {
    return this.core.listVessels();
  }

  beginVascularPulse(input: Parameters<CanonicalHortaCore['beginVascularPulse']>[0]): HortaVascularPulse {
    return this.core.beginVascularPulse(input);
  }

  beginSynergisticPulse(input: Parameters<CanonicalHortaCore['beginSynergisticPulse']>[0]): HortaSynergisticFlow {
    return this.core.beginSynergisticPulse(input);
  }

  completeSynergisticPulse(
    flowId: string,
    outcome: Exclude<HortaVascularOutcome, 'started' | 'rejected'>,
    error?: string,
  ): HortaSynergisticFlow | undefined {
    return this.core.completeSynergisticPulse(flowId, outcome, error);
  }

  getSynergisticFlow(id: string): HortaSynergisticFlow | undefined {
    return this.core.getSynergisticFlow(id);
  }

  listSynergisticFlows(): HortaSynergisticFlow[] {
    return this.core.listSynergisticFlows();
  }

  completeVascularPulse(
    pulseId: string,
    outcome: Exclude<HortaVascularOutcome, 'started' | 'rejected'>,
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
