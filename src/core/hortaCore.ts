/**
 * hortaCore — memória central de estado + circulação vascular do Aeternum.
 *
 * Existe uma única HortaCore.
 *
 * A analogia é vascular: uma mesma rede pode possuir muitos vasos e ramos,
 * mas a autoridade continua sendo uma só. O estado/fluxo não é duplicado por
 * fachada, módulo ou camada; as diferentes funções são mantidas dentro do
 * mesmo organismo e podem cooperar por correlação, observação e ramificação.
 *
 * Não é persistência de disco. É estado em memória com observadores.
 * Complementa qualquer store externo do N01 sem criar uma segunda autoridade.
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

/**
 * Relação funcional dentro da mesma HortaCore.
 *
 * O link não cria outro HortaCore nem outro armazenamento: descreve como um
 * vaso pode cooperar com outro componente/órgão do sistema.
 */
export interface HortaFunctionalLink {
  id: string;
  source: string;
  target: string;
  direction: HortaVascularDirection;
  role: string;
  active: boolean;
  capacityBytes: number;
  resistance: number;
  createdAt: number;
}

/**
 * Um fluxo sinérgico é uma única intenção correlacionada que pode ramificar
 * por vários vasos. Cada ramo continua sendo medido individualmente, logo
 * fan-out não apaga pressão, falha ou latência de nenhum caminho.
 */
export interface HortaSynergisticFlow {
  id: string;
  source: string;
  targets: string[];
  acceptedPulseIds: string[];
  rejectedTargets: Array<{ target: string; error: string }>;
  correlationId?: string;
  startedAt: number;
  status: 'accepted' | 'partial' | 'rejected' | 'completed';
}

type ObserverCallback = (value: unknown, change: HortaChange) => void;
type Unsubscribe = () => void;

export class HortaCore {
  private readonly data = new Map<string, unknown>();
  private readonly observers = new Map<string, ObserverCallback[]>();
  private readonly allObservers = new Set<(change: HortaChange) => void>();
  private readonly changeLog: HortaChange[] = [];
  private readonly maxLog: number;

  private readonly vessels = new Map<string, HortaVessel>();
  private readonly activePulses = new Map<string, HortaVascularPulse>();
  private readonly completedFlowLog: Array<{
    pulse: HortaVascularPulse;
    outcome: HortaVascularOutcome;
    durationMs: number;
    error?: string;
  }> = [];
  private readonly vascularMaxLog: number;

  private readonly functionalLinks = new Map<string, HortaFunctionalLink>();
  private readonly synergisticFlows = new Map<string, HortaSynergisticFlow>();

  private sequence = 0;
  private vascularSequence = 0;
  private synergySequence = 0;

  constructor(maxLog = 2000, vascularMaxLog = 2000) {
    this.maxLog = Math.max(1, Math.floor(maxLog));
    this.vascularMaxLog = Math.max(1, Math.floor(vascularMaxLog));
  }

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
    const s = String(source).trim();
    const t = String(target).trim();
    if (!s || !t || s === t) throw new Error('HORTA_INVALID_VESSEL_ENDPOINTS');

    const direction = options.direction ?? 'outbound';
    const id = `artery:${s}->${t}:${direction}`;
    const existing = this.vessels.get(id);
    if (existing) return { ...existing };

    const capacity = Number.isFinite(options.capacityBytes) && Number(options.capacityBytes) > 0
      ? Math.floor(Number(options.capacityBytes))
      : 1024 * 1024;
    const resistance = Number.isFinite(options.resistance) && Number(options.resistance) > 0
      ? Number(options.resistance)
      : 1;

    const vessel: HortaVessel = {
      id,
      source: s,
      target: t,
      direction,
      capacityBytes: Math.max(1, capacity),
      resistance,
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

  /**
   * Registra uma função de cooperação dentro da mesma rede vascular.
   *
   * O vínculo é estrutural e observável; execução continua passando pelo
   * beginVascularPulse/beginSynergisticPulse, portanto não há PASS sintético.
   */
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
    const vessel = this.ensureVessel(source, target, options);
    const id = `link:${vessel.id}:${options.role?.trim() || 'cooperation'}`;
    const existing = this.functionalLinks.get(id);
    if (existing) return { ...existing };

    const link: HortaFunctionalLink = {
      id,
      source: vessel.source,
      target: vessel.target,
      direction: vessel.direction,
      role: options.role?.trim() || 'cooperation',
      active: true,
      capacityBytes: vessel.capacityBytes,
      resistance: vessel.resistance,
      createdAt: Date.now(),
    };
    this.functionalLinks.set(id, link);
    this.set(`vascular.link.${id}.state`, 'ACTIVE');
    return { ...link };
  }

  getFunctionalLink(id: string): HortaFunctionalLink | undefined {
    const link = this.functionalLinks.get(id);
    return link ? { ...link } : undefined;
  }

  listFunctionalLinks(): HortaFunctionalLink[] {
    return [...this.functionalLinks.values()].map(link => ({ ...link }));
  }

  getVessel(id: string): HortaVessel | undefined {
    const v = this.vessels.get(id);
    return v ? { ...v } : undefined;
  }

  listVessels(): HortaVessel[] {
    return [...this.vessels.values()].map(v => ({ ...v }));
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
    const bytes = Math.max(
      1,
      Math.floor(Number.isFinite(input.bytes) && input.bytes >= 0 ? input.bytes : 0),
    );

    const vessel = this.ensureVessel(input.source, input.target, {
      direction: input.direction,
      capacityBytes: input.capacityBytes,
      resistance: input.resistance,
    });

    if ((vessel.inFlightBytes + bytes) / vessel.capacityBytes > 1) {
      vessel.rejectedPulses++;
      this.vessels.set(vessel.id, vessel);
      this.set(`vascular.vessel.${vessel.id}.state`, 'BACKPRESSURED');
      throw new Error(`HORTA_VESSEL_BACKPRESSURE:${vessel.id}`);
    }

    vessel.inFlightBytes += bytes;
    vessel.totalPulses++;
    vessel.lastPulseAt = Date.now();

    const util = Math.min(1, vessel.inFlightBytes / vessel.capacityBytes);
    vessel.lastPressure = 1 - util;
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

  /**
   * Ramificação sinérgica da mesma HortaCore.
   *
   * A intenção mantém uma única correlação e se divide em vasos independentes.
   * O retorno explicita aceitação/rejeição por alvo para que um ramo defeituoso
   * não esconda nem invalide artificialmente os demais.
   */
  beginSynergisticPulse(input: {
    source: string;
    targets: string[];
    bytes: number;
    direction?: HortaVascularDirection;
    correlationId?: string;
    messageId?: string;
    kind?: string;
    capability?: string;
    role?: string;
    capacityBytes?: number;
    resistance?: number;
  }): HortaSynergisticFlow {
    const source = String(input.source).trim();
    const targets = [...new Set((input.targets ?? []).map(target => String(target).trim()).filter(Boolean))];

    if (!source || targets.length === 0) {
      throw new Error('HORTA_SYNERGY_ENDPOINTS_REQUIRED');
    }
    if (targets.includes(source)) {
      throw new Error('HORTA_SYNERGY_SELF_TARGET_FORBIDDEN');
    }

    const id = `synergy-${++this.synergySequence}`;
    const acceptedPulseIds: string[] = [];
    const rejectedTargets: Array<{ target: string; error: string }> = [];

    for (const target of targets) {
      this.ensureFunctionalLink(source, target, {
        role: input.role ?? 'synergy',
        direction: input.direction,
        capacityBytes: input.capacityBytes,
        resistance: input.resistance,
      });

      try {
        const pulse = this.beginVascularPulse({
          source,
          target,
          direction: input.direction,
          bytes: input.bytes,
          correlationId: input.correlationId,
          messageId: input.messageId,
          kind: input.kind,
          capability: input.capability,
          capacityBytes: input.capacityBytes,
          resistance: input.resistance,
        });
        acceptedPulseIds.push(pulse.id);
      } catch (error) {
        rejectedTargets.push({
          target,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const status: HortaSynergisticFlow['status'] =
      acceptedPulseIds.length === 0 ? 'rejected'
        : rejectedTargets.length > 0 ? 'partial'
        : 'accepted';

    const flow: HortaSynergisticFlow = {
      id,
      source,
      targets,
      acceptedPulseIds,
      rejectedTargets,
      correlationId: input.correlationId,
      startedAt: Date.now(),
      status,
    };

    this.synergisticFlows.set(id, flow);
    this.set(`vascular.synergy.${id}.state`, status);
    this.set(`vascular.synergy.${id}.acceptedTargets`, acceptedPulseIds.length);
    this.set(`vascular.synergy.${id}.rejectedTargets`, rejectedTargets.length);
    return { ...flow, targets: [...flow.targets], acceptedPulseIds: [...flow.acceptedPulseIds], rejectedTargets: flow.rejectedTargets.map(item => ({ ...item })) };
  }

  completeSynergisticPulse(
    flowId: string,
    outcome: Exclude<HortaVascularOutcome, 'started' | 'rejected'>,
    error?: string,
  ): HortaSynergisticFlow | undefined {
    const flow = this.synergisticFlows.get(flowId);
    if (!flow) return undefined;

    for (const pulseId of flow.acceptedPulseIds) {
      this.completeVascularPulse(pulseId, outcome, error);
    }

    const updated: HortaSynergisticFlow = {
      ...flow,
      status: outcome === 'completed' ? 'completed' : 'partial',
      targets: [...flow.targets],
      acceptedPulseIds: [...flow.acceptedPulseIds],
      rejectedTargets: flow.rejectedTargets.map(item => ({ ...item })),
    };

    this.synergisticFlows.set(flowId, updated);
    this.set(`vascular.synergy.${flowId}.state`, updated.status);
    return updated;
  }

  getSynergisticFlow(id: string): HortaSynergisticFlow | undefined {
    const flow = this.synergisticFlows.get(id);
    return flow
      ? {
          ...flow,
          targets: [...flow.targets],
          acceptedPulseIds: [...flow.acceptedPulseIds],
          rejectedTargets: flow.rejectedTargets.map(item => ({ ...item })),
        }
      : undefined;
  }

  listSynergisticFlows(): HortaSynergisticFlow[] {
    return [...this.synergisticFlows.values()].map(flow => ({
      ...flow,
      targets: [...flow.targets],
      acceptedPulseIds: [...flow.acceptedPulseIds],
      rejectedTargets: flow.rejectedTargets.map(item => ({ ...item })),
    }));
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

    const duration = Math.max(0, Date.now() - pulse.startedAt);

    vessel.inFlightBytes = Math.max(0, vessel.inFlightBytes - pulse.bytes);
    vessel.totalBytes += pulse.bytes;
    vessel.totalDurationMs += duration;

    if (outcome === 'completed') vessel.completedPulses++;
    else vessel.failedPulses++;

    vessel.lastThroughputBytesPerSecond = duration > 0
      ? pulse.bytes / (duration / 1000)
      : pulse.bytes;

    const util = Math.min(1, vessel.inFlightBytes / vessel.capacityBytes);
    vessel.lastPressure = 1 - util;
    vessel.lastPerfusionIndex = vessel.lastPressure / vessel.resistance;

    this.vessels.set(vessel.id, vessel);
    this.activePulses.delete(pulseId);

    this.completedFlowLog.push({
      pulse: { ...pulse },
      outcome,
      durationMs: duration,
      ...(error ? { error } : {}),
    });
    if (this.completedFlowLog.length > this.vascularMaxLog) this.completedFlowLog.shift();

    this.set(`vascular.pulse.${pulse.id}.state`, outcome);
    if (error) this.set(`vascular.pulse.${pulse.id}.error`, error);

    return { ...pulse };
  }

  vascularHealth(): HortaVascularHealth {
    const vs = this.listVessels();
    const active = this.activePulses.size;
    const inFlightBytes = vs.reduce((s, v) => s + v.inFlightBytes, 0);
    const totalPulses = vs.reduce((s, v) => s + v.totalPulses, 0);
    const completedPulses = vs.reduce((s, v) => s + v.completedPulses, 0);
    const failedPulses = vs.reduce((s, v) => s + v.failedPulses, 0);
    const rejectedPulses = vs.reduce((s, v) => s + v.rejectedPulses, 0);

    const utilization = vs.length
      ? vs.reduce((s, v) => s + v.inFlightBytes / v.capacityBytes, 0) / vs.length
      : 0;
    const pressure = vs.length
      ? vs.reduce((s, v) => s + v.lastPressure, 0) / vs.length
      : 1;
    const perfusionIndex = vs.length
      ? vs.reduce((s, v) => s + v.lastPerfusionIndex, 0) / vs.length
      : 1;

    const totalBytes = vs.reduce((s, v) => s + v.totalBytes, 0);
    const totalDurationMs = vs.reduce((s, v) => s + v.totalDurationMs, 0);

    return {
      status: pressure < 0.1 ? 'DEGRADED' : 'HEALTHY',
      vesselCount: vs.length,
      activePulses: active,
      inFlightBytes,
      totalPulses,
      completedPulses,
      failedPulses,
      rejectedPulses,
      utilization,
      pressure,
      perfusionIndex,
      throughputBytesPerSecond: totalDurationMs ? totalBytes / (totalDurationMs / 1000) : 0,
    };
  }

  getVascularFlowLog() {
    return this.completedFlowLog.map(e => ({
      pulse: { ...e.pulse },
      outcome: e.outcome,
      durationMs: e.durationMs,
      ...(e.error ? { error: e.error } : {}),
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
    this.functionalLinks.clear();
    this.synergisticFlows.clear();
    this.sequence = 0;
    this.vascularSequence = 0;
    this.synergySequence = 0;
  }
}

export const hortaCore = new HortaCore(2000, 2000);
