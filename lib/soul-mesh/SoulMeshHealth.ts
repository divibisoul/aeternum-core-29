export type HealthState = 'ALIVE' | 'READY' | 'DEGRADED' | 'UNREACHABLE';
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface HealthSnapshot {
  state: HealthState;
  healthScore: number;
  checkedAt: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
}

export interface HealthPolicy {
  failureThreshold: number;
  successThreshold: number;
  openCooldownMs: number;
}

const DEFAULT_POLICY: HealthPolicy = {
  failureThreshold: 3,
  successThreshold: 1,
  openCooldownMs: 30_000,
};

/** Stateful peer-health primitive. No background timers: safe for serverless runtimes. */
export class SoulMeshHealth {
  private snapshot: HealthSnapshot = {
    state: 'UNREACHABLE', healthScore: 0, checkedAt: 0,
    consecutiveFailures: 0, consecutiveSuccesses: 0,
  };
  private circuit: CircuitState = 'CLOSED';
  private openedAt = 0;
  private readonly policy: HealthPolicy;

  constructor(policy: Partial<HealthPolicy> = {}) {
    this.policy = { ...DEFAULT_POLICY, ...policy };
  }

  recordSuccess(ready = true): HealthSnapshot {
    const now = Date.now();
    this.snapshot = {
      state: ready ? 'READY' : 'ALIVE',
      healthScore: Math.min(100, this.snapshot.healthScore + 20),
      checkedAt: now,
      consecutiveFailures: 0,
      consecutiveSuccesses: this.snapshot.consecutiveSuccesses + 1,
    };
    if (this.circuit === 'HALF_OPEN' || this.snapshot.consecutiveSuccesses >= this.policy.successThreshold) {
      this.circuit = 'CLOSED';
      this.openedAt = 0;
    }
    return this.snapshot;
  }

  recordFailure(): HealthSnapshot {
    const now = Date.now();
    const failures = this.snapshot.consecutiveFailures + 1;
    this.snapshot = {
      state: failures >= this.policy.failureThreshold ? 'UNREACHABLE' : 'DEGRADED',
      healthScore: Math.max(0, this.snapshot.healthScore - 34),
      checkedAt: now,
      consecutiveFailures: failures,
      consecutiveSuccesses: 0,
    };
    if (failures >= this.policy.failureThreshold) {
      this.circuit = 'OPEN';
      this.openedAt = now;
    }
    return this.snapshot;
  }

  canAttempt(now = Date.now()): boolean {
    if (this.circuit === 'CLOSED') return true;
    if (this.circuit === 'OPEN' && now - this.openedAt >= this.policy.openCooldownMs) {
      this.circuit = 'HALF_OPEN';
      return true;
    }
    return this.circuit === 'HALF_OPEN';
  }

  getSnapshot(): HealthSnapshot { return { ...this.snapshot }; }
  getCircuitState(): CircuitState { return this.circuit; }
}
