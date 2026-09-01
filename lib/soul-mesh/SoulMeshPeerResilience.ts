import { SoulMeshHealth, type HealthPolicy, type HealthSnapshot, type CircuitState } from './SoulMeshHealth.ts';

export interface PeerResilienceSnapshot extends HealthSnapshot {
  nucleus: string;
  circuit: CircuitState;
  routable: boolean;
}

/** Reuses SoulMeshHealth to gate traffic per peer without background timers. */
export class SoulMeshPeerResilience {
  private readonly peers = new Map<string, SoulMeshHealth>();
  private readonly policy: Partial<HealthPolicy>;

  constructor(policy: Partial<HealthPolicy> = {}) {
    this.policy = policy;
  }

  private health(nucleus: string): SoulMeshHealth {
    let health = this.peers.get(nucleus);
    if (!health) {
      health = new SoulMeshHealth(this.policy);
      this.peers.set(nucleus, health);
    }
    return health;
  }

  recordSuccess(nucleus: string, ready = true): PeerResilienceSnapshot {
    const health = this.health(nucleus);
    health.recordSuccess(ready);
    return this.snapshot(nucleus);
  }

  recordFailure(nucleus: string): PeerResilienceSnapshot {
    const health = this.health(nucleus);
    health.recordFailure();
    return this.snapshot(nucleus);
  }

  canRoute(nucleus: string, now = Date.now()): boolean {
    return this.health(nucleus).canAttempt(now);
  }

  snapshot(nucleus: string): PeerResilienceSnapshot {
    const health = this.health(nucleus);
    const snapshot = health.getSnapshot();
    return { ...snapshot, nucleus, circuit: health.getCircuitState(), routable: health.getCircuitState() !== 'OPEN' };
  }

  snapshotAll(): readonly PeerResilienceSnapshot[] {
    return [...this.peers.keys()].sort().map((nucleus) => this.snapshot(nucleus));
  }
}
