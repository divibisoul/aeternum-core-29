/**
 * Shared processor runtime: lifecycle, isolation, backpressure, timeouts,
 * heartbeat publication, metrics and restart.
 *
 * Every processor keeps its own identity and logic; the runtime only owns
 * infrastructure concerns. Duplicated start is rejected, and every timer
 * and subscription registered here is released on stop/restart.
 */
import { comparePriority, isExpired, type FusionEnvelope } from './FusionEnvelope';
import { PROCESSOR_ERROR, type MetricValue, type Processor, type ProcessorHealthState } from './ProcessorContract';
import type { ProcessorHealthRegistry } from './ProcessorHealthRegistry';

export interface ProcessorRuntimeOptions {
  healthRegistry: ProcessorHealthRegistry;
  /** Hard execution timeout per envelope. */
  defaultTimeoutMs?: number;
  /** Maximum concurrent executions for this processor. */
  maxConcurrency?: number;
  /** Maximum queued envelopes before backpressure rejection. */
  maxQueueDepth?: number;
  heartbeatIntervalMs?: number;
  /** Window size for latency / error-rate metrics. */
  metricsWindow?: number;
  now?: () => number;
  setInterval?: (handler: () => void, ms: number) => unknown;
  clearInterval?: (handle: unknown) => void;
}

export interface RuntimeMetrics {
  invocations: number;
  successes: number;
  failures: number;
  timeouts: number;
  rejectedBackpressure: number;
  expired: number;
  restarts: number;
  inFlight: number;
  queueDepth: number;
  meanLatencyMs: MetricValue;
  p95LatencyMs: MetricValue;
  errorRate: MetricValue;
  lastError?: string;
}

type QueueEntry = {
  envelope: FusionEnvelope;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

export class ProcessorRuntime {
  readonly processor: Processor;
  private state: ProcessorHealthState = 'OFFLINE';
  private started = false;
  private readonly options: Required<Pick<ProcessorRuntimeOptions, 'defaultTimeoutMs' | 'maxConcurrency' | 'maxQueueDepth' | 'heartbeatIntervalMs' | 'metricsWindow'>>;
  private readonly registry: ProcessorHealthRegistry;
  private readonly now: () => number;
  private readonly setIntervalFn: (handler: () => void, ms: number) => unknown;
  private readonly clearIntervalFn: (handle: unknown) => void;
  private heartbeatHandle: unknown;
  private readonly cleanups: Array<() => void> = [];
  private readonly queue: QueueEntry[] = [];
  private inFlight = 0;
  private readonly latencies: number[] = [];
  private readonly outcomes: boolean[] = [];
  private counters = { invocations: 0, successes: 0, failures: 0, timeouts: 0, rejectedBackpressure: 0, expired: 0, restarts: 0 };
  private lastError: string | undefined;

  constructor(processor: Processor, options: ProcessorRuntimeOptions) {
    this.processor = processor;
    this.registry = options.healthRegistry;
    this.now = options.now ?? (() => Date.now());
    this.setIntervalFn = options.setInterval ?? ((handler, ms) => setInterval(handler, ms));
    this.clearIntervalFn = options.clearInterval ?? ((handle) => clearInterval(handle as ReturnType<typeof setInterval>));
    this.options = {
      defaultTimeoutMs: options.defaultTimeoutMs ?? 10_000,
      maxConcurrency: options.maxConcurrency ?? 4,
      maxQueueDepth: options.maxQueueDepth ?? 64,
      heartbeatIntervalMs: options.heartbeatIntervalMs ?? 5_000,
      metricsWindow: options.metricsWindow ?? 50,
    };
  }

  get id(): string { return this.processor.descriptor.id; }
  get currentState(): ProcessorHealthState { return this.state; }
  get isStarted(): boolean { return this.started; }

  /** Registers a resource released on stop(); prevents subscription leaks across restarts. */
  registerCleanup(cleanup: () => void): void {
    this.cleanups.push(cleanup);
  }

  async start(): Promise<void> {
    if (this.started) throw new Error(PROCESSOR_ERROR.ALREADY_STARTED);
    this.started = true;
    const commissioning = this.processor.descriptor.commissioning;
    if (commissioning !== 'OPERATIONAL') {
      this.state = 'OFFLINE';
      this.publishHeartbeat();
      return;
    }
    this.state = 'INITIALIZING';
    this.publishHeartbeat();
    try {
      await this.processor.initialize?.();
      this.state = 'ACTIVE';
    } catch (error) {
      this.state = 'FAILED';
      this.lastError = error instanceof Error ? error.message : String(error);
      this.publishHeartbeat();
      throw error;
    }
    this.heartbeatHandle = this.setIntervalFn(() => this.publishHeartbeat(), this.options.heartbeatIntervalMs);
    this.publishHeartbeat();
  }

  async stop(): Promise<void> {
    if (!this.started) return;
    this.started = false;
    if (this.heartbeatHandle !== undefined) {
      this.clearIntervalFn(this.heartbeatHandle);
      this.heartbeatHandle = undefined;
    }
    while (this.cleanups.length > 0) {
      const cleanup = this.cleanups.pop();
      try { cleanup?.(); } catch { /* cleanup must never block shutdown */ }
    }
    const drained = this.queue.splice(0, this.queue.length);
    for (const entry of drained) entry.reject(new Error(PROCESSOR_ERROR.NOT_STARTED));
    try { await this.processor.shutdown?.(); } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
    }
    this.state = 'OFFLINE';
    this.publishHeartbeat();
  }

  /** Isolated restart: full cleanup, then re-initialize and re-register heartbeat. */
  async restart(): Promise<void> {
    this.state = 'RECOVERING';
    this.publishHeartbeat();
    await this.stop();
    this.counters.restarts += 1;
    await this.start();
  }

  async execute(envelope: FusionEnvelope): Promise<unknown> {
    if (this.processor.descriptor.commissioning !== 'OPERATIONAL') {
      throw new Error(`${PROCESSOR_ERROR.BLOCKED}:${this.id}:${this.processor.descriptor.commissioning}`);
    }
    if (!this.started) throw new Error(PROCESSOR_ERROR.NOT_STARTED);
    if (!this.processor.descriptor.capabilities.includes(envelope.capability)) {
      throw new Error(`${PROCESSOR_ERROR.CAPABILITY_REJECTED}:${envelope.capability}`);
    }
    if (isExpired(envelope, this.now())) {
      this.counters.expired += 1;
      throw new Error(PROCESSOR_ERROR.EXPIRED);
    }
    if (this.queue.length >= this.options.maxQueueDepth) {
      this.counters.rejectedBackpressure += 1;
      this.publishHeartbeat();
      throw new Error(`${PROCESSOR_ERROR.BACKPRESSURE}:${this.id}`);
    }

    return new Promise<unknown>((resolve, reject) => {
      this.queue.push({ envelope, resolve, reject });
      this.queue.sort((a, b) => comparePriority(a.envelope, b.envelope));
      this.pump();
    });
  }

  private pump(): void {
    while (this.inFlight < this.options.maxConcurrency && this.queue.length > 0) {
      const entry = this.queue.shift();
      if (!entry) return;
      void this.run(entry);
    }
  }

  private async run(entry: QueueEntry): Promise<void> {
    this.inFlight += 1;
    this.counters.invocations += 1;
    const startedAt = this.now();
    const budget = entry.envelope.deadlineAt !== undefined
      ? Math.max(1, entry.envelope.deadlineAt - startedAt)
      : this.options.defaultTimeoutMs;

    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const output = await Promise.race([
        Promise.resolve(this.processor.handle(entry.envelope)),
        new Promise<never>((_, rejectTimeout) => {
          timer = setTimeout(() => rejectTimeout(new Error(`${PROCESSOR_ERROR.TIMEOUT}:${this.id}:${budget}ms`)), budget);
        }),
      ]);
      this.record(true, this.now() - startedAt);
      entry.resolve(output);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.startsWith(PROCESSOR_ERROR.TIMEOUT)) this.counters.timeouts += 1;
      this.lastError = message;
      this.record(false, this.now() - startedAt);
      entry.reject(error instanceof Error ? error : new Error(message));
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      this.inFlight -= 1;
      this.publishHeartbeat();
      this.pump();
    }
  }

  private record(success: boolean, latencyMs: number): void {
    if (success) this.counters.successes += 1; else this.counters.failures += 1;
    this.latencies.push(latencyMs);
    this.outcomes.push(success);
    while (this.latencies.length > this.options.metricsWindow) this.latencies.shift();
    while (this.outcomes.length > this.options.metricsWindow) this.outcomes.shift();
    if (this.state === 'ACTIVE' || this.state === 'DEGRADED' || this.state === 'UNHEALTHY') {
      const errorRate = this.errorRate();
      this.state = typeof errorRate === 'number' && errorRate > 0.5 ? 'UNHEALTHY' : 'ACTIVE';
    }
  }

  private errorRate(): MetricValue {
    if (this.outcomes.length === 0) return 'unavailable';
    return this.outcomes.filter((ok) => !ok).length / this.outcomes.length;
  }

  private percentile(ratio: number): MetricValue {
    if (this.latencies.length === 0) return 'unavailable';
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(ratio * sorted.length) - 1));
    return sorted[index];
  }

  metrics(): RuntimeMetrics {
    return {
      ...this.counters,
      inFlight: this.inFlight,
      queueDepth: this.queue.length,
      meanLatencyMs: this.latencies.length === 0
        ? 'unavailable'
        : this.latencies.reduce((sum, value) => sum + value, 0) / this.latencies.length,
      p95LatencyMs: this.percentile(0.95),
      errorRate: this.errorRate(),
      lastError: this.lastError,
    };
  }

  publishHeartbeat(): void {
    const metrics = this.metrics();
    this.registry.publish({
      processorId: this.id,
      state: this.state,
      commissioning: this.processor.descriptor.commissioning,
      at: this.now(),
      queueDepth: metrics.queueDepth,
      inFlight: metrics.inFlight,
      meanLatencyMs: metrics.meanLatencyMs,
      errorRate: metrics.errorRate,
      lastError: metrics.lastError,
      restarts: metrics.restarts,
    });
  }
}
