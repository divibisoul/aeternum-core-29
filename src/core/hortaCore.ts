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


export type HortaVascularDirection = 'inbound' | 'outbound';
export type HortaVascularOutcome = 'started' | 'completed' | 'failed' | 'rejected';

export interface HortaVessel {
  id: string;
  source: string;
  target: string;
  direction: HortaVascularDirection;
  capacityBytes: number;
  resistance: number;
  inFlightBytes: number;
  totalPulses: number;
  completedPulses: number;
  failedPulses: number;
  rejectedPulses: number;
  totalBytes: number;
  totalDurationMs: number;
  lastPressure: number;
  lastPerfusionIndex: number;
  lastThroughputBytesPerSecond: number;
  lastPulseAt?: number;
}

export interface HortaVascularPulse {
  id: string;
  vesselId: string;
  source: string;
  target: string;
  direction: HortaVascularDirection;
  bytes: number;
  correlationId?: string;
  messageId?: string;
  kind?: string;
  capability?: string;
  startedAt: number;
}

export interface HortaVascularHealth {
  status: 'HEALTHY' | 'DEGRADED';
  vesselCount: number;
  activePulses: number;
  inFlightBytes: number;
  totalPulses: number;
  completedPulses: number;
  failedPulses: number;
  rejectedPulses: number;
  utilization: number;
  pressure: number;
  perfusionIndex: number;
  throughputBytesPerSecond: number;
}

type ObserverCallback = (value: unknown, change: HortaChange) => void;
type Unsubscribe = () => void;

const DEFAULT_VESSEL_CAPACITY_BYTES = 1024 * 1024;
const DEFAULT_VESSEL_RESISTANCE = 1;
const MAX_FLOW_LOG = 2000;

function finitePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}


export class HortaCore {
  private readonly data = new Map<string, unknown>();
  private readonly observers = new Map<string, ObserverCallback[]>();
  private readonly allObservers = new Set<(change: HortaChange) => void>();
  private readonly changeLog: HortaChange[] = [];
  private readonly vessels = new Map<string, HortaVessel>();
  private readonly activePulses = new Map<string, HortaVascularPulse>();
  private readonly completedFlowLog: Array<{
    pulse: HortaVascularPulse;
    outcome: HortaVascularOutcome;
    durationMs: number;
    error?: string;
  }> = [];
  private readonly maxLog = 1000;
  private sequence = 0;
  private vascularSequence = 0;
  private totalRejected = 0;

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


  ensureVessel(
    source: string,
    target: string,
    options: {
      capacityBytes?: number;
      resistance?: number;
      direction?: HortaVascularDirection;
    } = {},
  ): HortaVessel {
    const normalizedSource = String(source).trim();
    const normalizedTarget = String(target).trim();
    if (!normalizedSource || !normalizedTarget || normalizedSource === normalizedTarget) {
      throw new Error('HORTA_INVALID_VESSEL_ENDPOINTS');
    }
    const direction = options.direction ?? 'outbound';
    const id = `artery:${normalizedSource}->${normalizedTarget}`;
    const existing = this.vessels.get(id);
    if (existing) return { ...existing };
    const vessel: HortaVessel = {
      id,
      source: normalizedSource,
      target: normalizedTarget,
      direction,
      capacityBytes: Math.max(1, Math.floor(finitePositive(options.capacityBytes ?? DEFAULT_VESSEL_CAPACITY_BYTES, DEFAULT_VESSEL_CAPACITY_BYTES))),
      resistance: finitePositive(options.resistance ?? DEFAULT_VESSEL_RESISTANCE, DEFAULT_VESSEL_RESISTANCE),
      inFlightBytes: 0,
      totalPulses: 0,
      completedPulses: 0,
      failedPulses: 0,
      rejectedPulses: 0,
      totalBytes: 0,
      totalDurationMs: 0,
      lastPressure: 1,
      lastPerfusionIndex: 1,
      lastThroughputBytesPerSecond: 0,
    };
    this.vessels.set(id, vessel);
    this.set(`vascular.vessel.${id}.state`, 'HEALTHY');
    return { ...vessel };
  }

  getVessel(id: string): HortaVessel | undefined {
    const vessel = this.vessels.get(id);
    return vessel ? { ...vessel } : undefined;
  }

  listVessels(): HortaVessel[] {
    return [...this.vessels.values()].map(vessel => ({ ...vessel }));
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
    const bytes = Math.max(1, Math.floor(finiteNonNegative(input.bytes)));
    const vessel = this.ensureVessel(input.source, input.target, {
      direction: input.direction,
      capacityBytes: input.capacityBytes,
      resistance: input.resistance,
    });
    const projectedUtilization = (vessel.inFlightBytes + bytes) / vessel.capacityBytes;
    if (projectedUtilization > 1) {
      vessel.rejectedPulses += 1;
      this.totalRejected += 1;
      this.vessels.set(vessel.id, vessel);
      this.set(`vascular.vessel.${vessel.id}.state`, 'BACKPRESSURED');
      throw new Error(`HORTA_VESSEL_BACKPRESSURE:${vessel.id}`);
    }
    vessel.inFlightBytes += bytes;
    vessel.totalPulses += 1;
    vessel.lastPulseAt = Date.now();
    const utilization = clamp01(vessel.inFlightBytes / vessel.capacityBytes);
    vessel.lastPressure = clamp01(1 - utilization);
    vessel.lastPerfusionIndex = vessel.lastPressure / vessel.resistance;
    this.vessels.set(vessel.id, vessel);
    const pulse: HortaVascularPulse = {
      id: `pulse-${++this.vascularSequence}`,
      vesselId: vessel.id,
      source: vessel.source,
      target: vessel.target,
      direction: input.direction ?? 'outbound',
      bytes,
      correlationId: input.correlationId,
      messageId: input.messageId,
      kind: input.kind,
      capability: input.capability,
      startedAt: Date.now(),
    };
    this.activePulses.set(pulse.id, pulse);
    this.set(`vascular.pulse.${pulse.id}.state`, 'started');
    return { ...pulse };
  }

  completeVascularPulse(
    pulseId: string,
    outcome: Exclude<HortaVascularOutcome, 'started' | 'rejected'>,
    error?: string,
  ): HortaVascularPulse | undefined {
    const pulse = this.activePulses.get(pulseId);
    if (!pulse) return undefined;
    const vessel = this.vessels.get(pulse.vesselId);
    if (!vessel) {
      this.activePulses.delete(pulseId);
      return undefined;
    }
    const durationMs = Math.max(0, Date.now() - pulse.startedAt);
    vessel.inFlightBytes = Math.max(0, vessel.inFlightBytes - pulse.bytes);
    vessel.totalBytes += pulse.bytes;
    vessel.totalDurationMs += durationMs;
    if (outcome === 'completed') vessel.completedPulses += 1;
    else vessel.failedPulses += 1;
    vessel.lastThroughputBytesPerSecond = durationMs > 0 ? pulse.bytes / (durationMs / 1000) : pulse.bytes;
    const utilization = clamp01(vessel.inFlightBytes / vessel.capacityBytes);
    vessel.lastPressure = clamp01(1 - utilization);
    vessel.lastPerfusionIndex = vessel.lastPressure / vessel.resistance;
    this.vessels.set(vessel.id, vessel);
    this.activePulses.delete(pulseId);
    this.completedFlowLog.push({
      pulse: { ...pulse },
      outcome,
      durationMs,
      ...(error ? { error } : {}),
    });
    if (this.completedFlowLog.length > MAX_FLOW_LOG) this.completedFlowLog.shift();
    this.set(`vascular.pulse.${pulse.id}.state`, outcome);
    if (error) this.set(`vascular.pulse.${pulse.id}.error`, error);
    return { ...pulse };
  }

  vascularHealth(): HortaVascularHealth {
    const vessels = this.listVessels();
    const activePulses = this.activePulses.size;
    const inFlightBytes = vessels.reduce((sum, vessel) => sum + vessel.inFlightBytes, 0);
    const totalPulses = vessels.reduce((sum, vessel) => sum + vessel.totalPulses, 0);
    const completedPulses = vessels.reduce((sum, vessel) => sum + vessel.completedPulses, 0);
    const failedPulses = vessels.reduce((sum, vessel) => sum + vessel.failedPulses, 0);
    const rejectedPulses = vessels.reduce((sum, vessel) => sum + vessel.rejectedPulses, 0);
    const utilization = vessels.length === 0 ? 0 : vessels.reduce((sum, vessel) => sum + vessel.inFlightBytes / vessel.capacityBytes, 0) / vessels.length;
    const pressure = vessels.length === 0 ? 1 : vessels.reduce((sum, vessel) => sum + vessel.lastPressure, 0) / vessels.length;
    const perfusionIndex = vessels.length === 0 ? 1 : vessels.reduce((sum, vessel) => sum + vessel.lastPerfusionIndex, 0) / vessels.length;
    const totalBytes = vessels.reduce((sum, vessel) => sum + vessel.totalBytes, 0);
    const totalDurationMs = vessels.reduce((sum, vessel) => sum + vessel.totalDurationMs, 0);
    const throughputBytesPerSecond = totalDurationMs > 0 ? totalBytes / (totalDurationMs / 1000) : 0;
    return {
      status: rejectedPulses > 0 || pressure < 0.1 ? 'DEGRADED' : 'HEALTHY',
      vesselCount: vessels.length,
      activePulses,
      inFlightBytes,
      totalPulses,
      completedPulses,
      failedPulses,
      rejectedPulses,
      utilization,
      pressure,
      perfusionIndex,
      throughputBytesPerSecond,
    };
  }

  getVascularFlowLog(): Array<{
    pulse: HortaVascularPulse;
    outcome: HortaVascularOutcome;
    durationMs: number;
    error?: string;
  }> {
    return this.completedFlowLog.map(entry => ({
      pulse: { ...entry.pulse },
      outcome: entry.outcome,
      durationMs: entry.durationMs,
      ...(entry.error ? { error: entry.error } : {}),
    }));
  }

  clear(): void {
    this.data.clear();
    this.observers.clear();
    this.allObservers.clear();
    this.changeLog.length = 0;
    this.vessels.clear();
    this.activePulses.clear();
    this.completedFlowLog.length = 0;
    this.sequence = 0;
    this.vascularSequence = 0;
    this.totalRejected = 0;
  }
}

export const hortaCore = new HortaCore();
