/**
 * Shared heartbeat / health registry for fusion processors.
 *
 * Health is NOT decided by latency alone. It combines liveness (heartbeat
 * freshness), declared state, queue saturation and recent error rate.
 * Metrics that cannot be measured are reported as 'unavailable'.
 */
import type { MetricValue, ProcessorCommissioning, ProcessorHealthState } from './ProcessorContract';

export interface Heartbeat {
  processorId: string;
  state: ProcessorHealthState;
  commissioning: ProcessorCommissioning;
  at: number;
  queueDepth: number;
  inFlight: number;
  /** Mean latency of the observed window, or 'unavailable' when nothing ran yet. */
  meanLatencyMs: MetricValue;
  errorRate: MetricValue;
  lastError?: string;
  restarts: number;
}

export interface ProcessorHealth extends Heartbeat {
  /** Effective state after staleness evaluation. */
  effectiveState: ProcessorHealthState;
  heartbeatAgeMs: number;
  stale: boolean;
  reasons: readonly string[];
}

export interface HealthRegistryOptions {
  /** A heartbeat older than this is stale -> OFFLINE. */
  stalenessMs?: number;
  /** Queue depth above which the processor is DEGRADED. */
  queueDegradedThreshold?: number;
  /** Error rate above which the processor is UNHEALTHY. */
  errorRateUnhealthyThreshold?: number;
  now?: () => number;
}

export class ProcessorHealthRegistry {
  private readonly beats = new Map<string, Heartbeat>();
  private readonly stalenessMs: number;
  private readonly queueDegradedThreshold: number;
  private readonly errorRateUnhealthyThreshold: number;
  private readonly now: () => number;

  constructor(options: HealthRegistryOptions = {}) {
    this.stalenessMs = options.stalenessMs ?? 15_000;
    this.queueDegradedThreshold = options.queueDegradedThreshold ?? 32;
    this.errorRateUnhealthyThreshold = options.errorRateUnhealthyThreshold ?? 0.5;
    this.now = options.now ?? (() => Date.now());
  }

  publish(beat: Heartbeat): void {
    if (!beat.processorId.trim()) throw new Error('HEARTBEAT_PROCESSOR_ID_REQUIRED');
    this.beats.set(beat.processorId, { ...beat });
  }

  remove(processorId: string): boolean {
    return this.beats.delete(processorId);
  }

  get(processorId: string): ProcessorHealth | undefined {
    const beat = this.beats.get(processorId);
    return beat ? this.evaluate(beat) : undefined;
  }

  snapshot(): readonly ProcessorHealth[] {
    return [...this.beats.values()].map((beat) => this.evaluate(beat));
  }

  private evaluate(beat: Heartbeat): ProcessorHealth {
    const heartbeatAgeMs = Math.max(0, this.now() - beat.at);
    const stale = heartbeatAgeMs > this.stalenessMs;
    const reasons: string[] = [];
    let effectiveState: ProcessorHealthState = beat.state;

    if (beat.commissioning !== 'OPERATIONAL') {
      reasons.push(`commissioning:${beat.commissioning}`);
      effectiveState = 'OFFLINE';
    } else if (stale) {
      reasons.push(`heartbeat-stale:${heartbeatAgeMs}ms`);
      effectiveState = 'OFFLINE';
    } else if (beat.state === 'ACTIVE') {
      if (typeof beat.errorRate === 'number' && beat.errorRate > this.errorRateUnhealthyThreshold) {
        reasons.push(`error-rate:${beat.errorRate.toFixed(2)}`);
        effectiveState = 'UNHEALTHY';
      } else if (beat.queueDepth > this.queueDegradedThreshold) {
        reasons.push(`queue-saturated:${beat.queueDepth}`);
        effectiveState = 'DEGRADED';
      }
    } else {
      reasons.push(`declared:${beat.state}`);
    }

    if (reasons.length === 0) reasons.push('healthy');
    return { ...beat, effectiveState, heartbeatAgeMs, stale, reasons };
  }

  /** Aggregate view used by the ERU processor and by NVOD telemetry. */
  aggregate(): {
    total: number;
    byState: Record<ProcessorHealthState, number>;
    operational: number;
    blocked: number;
  } {
    const byState: Record<ProcessorHealthState, number> = {
      INITIALIZING: 0, ACTIVE: 0, DEGRADED: 0, UNHEALTHY: 0, OFFLINE: 0, RECOVERING: 0, FAILED: 0,
    };
    let operational = 0;
    let blocked = 0;
    for (const health of this.snapshot()) {
      byState[health.effectiveState] += 1;
      if (health.commissioning === 'OPERATIONAL') operational += 1;
      else blocked += 1;
    }
    return { total: this.beats.size, byState, operational, blocked };
  }
}
