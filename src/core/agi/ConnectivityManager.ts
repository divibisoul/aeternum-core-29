/**
 * Advanced Connectivity Manager
 *
 * Provides a real observation boundary for the SOUL internal connectivity
 * model. Registration is not the same as network connectivity.
 */
export interface MeshNode {
  id: string;
  type: string;
  status: 'connected' | 'disconnected' | 'syncing';
  latency: number;
  lastSeen: number;
  observed: boolean;
}

export interface ConnectivityMetrics {
  meshNodes: number;
  avgLatency: number;
  bandwidth: number;
  reliability: number;
  iotDevices: number;
  quantumEncrypted: boolean;
  observed: boolean;
  bandwidthSource: 'OBSERVED' | 'UNOBSERVED';
  reliabilitySource: 'OBSERVED' | 'UNOBSERVED';
  encryptionSource: 'OBSERVED' | 'UNOBSERVED';
}

export class ConnectivityManager {
  private meshNetwork: Map<string, MeshNode> = new Map();
  private _initialized = false;
  private _running = false;
  private _tickInterval: ReturnType<typeof setInterval> | null = null;
  private _bandwidth = 0;
  private _reliability = 0;
  private _bandwidthObserved = false;
  private _reliabilityObserved = false;
  private _quantumEncryptionObserved = false;
  private _quantumEncrypted = false;

  get initialized(): boolean { return this._initialized; }
  get isRunning(): boolean { return this._running; }

  initialize(): void {
    if (this._initialized) return;

    const subsystems = [
      'consciousness', 'godel', 'darwin', 'lattice',
      'safeCore', 'selfHealing', 'ethics', 'hyperSafety',
      'nip', 'quantumNeural'
    ];

    for (const id of subsystems) {
      this.meshNetwork.set(id, {
        id,
        type: 'agi-subsystem',
        status: 'disconnected',
        latency: 0,
        lastSeen: 0,
        observed: false,
      });
    }

    this._initialized = true;
  }

  start(tickMs: number = 5000): void {
    if (this._running) return;
    this._running = true;
    this._tickInterval = setInterval(() => this.tick(), tickMs);
    this.tick();
  }

  stop(): void {
    if (this._tickInterval) clearInterval(this._tickInterval);
    this._tickInterval = null;
    this._running = false;
  }

  private tick(): void {
    // No synthetic network fluctuation is generated. Network state changes only
    // through explicit observations from a real transport/peer.
    for (const node of this.meshNetwork.values()) {
      if (node.observed && node.lastSeen > 0 && Date.now() - node.lastSeen > 15000) {
        node.status = 'disconnected';
      }
    }
  }

  recordNodeObservation(id: string, observation: {
    status: MeshNode['status'];
    latencyMs: number;
    observedAt?: number;
  }): void {
    if (!this.meshNetwork.has(id)) {
      this.meshNetwork.set(id, {
        id,
        type: 'external-observed',
        status: observation.status,
        latency: observation.latencyMs,
        lastSeen: observation.observedAt ?? Date.now(),
        observed: true,
      });
      return;
    }
    const node = this.meshNetwork.get(id)!;
    node.status = observation.status;
    node.latency = Math.max(0, Number.isFinite(observation.latencyMs) ? observation.latencyMs : 0);
    node.lastSeen = observation.observedAt ?? Date.now();
    node.observed = true;
  }

  recordBandwidthObservation(mbps: number): void {
    if (!Number.isFinite(mbps) || mbps < 0) throw new Error('Invalid bandwidth observation');
    this._bandwidth = mbps;
    this._bandwidthObserved = true;
  }

  recordReliabilityObservation(value: number): void {
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('Invalid reliability observation');
    this._reliability = value;
    this._reliabilityObserved = true;
  }

  recordEncryptionObservation(encrypted: boolean): void {
    this._quantumEncrypted = encrypted;
    this._quantumEncryptionObserved = true;
  }

  registerNode(id: string, type: string): void {
    const existing = this.meshNetwork.get(id);
    if (existing) {
      existing.type = type;
      return;
    }
    this.meshNetwork.set(id, {
      id,
      type,
      status: 'disconnected',
      latency: 0,
      lastSeen: 0,
      observed: false,
    });
  }

  getMetrics(): ConnectivityMetrics {
    const nodes = Array.from(this.meshNetwork.values());
    const connectedObserved = nodes.filter(n => n.status === 'connected' && n.observed);

    return {
      meshNodes: nodes.length,
      avgLatency: connectedObserved.length > 0
        ? connectedObserved.reduce((sum, node) => sum + node.latency, 0) / connectedObserved.length
        : 0,
      bandwidth: this._bandwidth,
      reliability: this._reliability,
      iotDevices: 0,
      quantumEncrypted: this._quantumEncrypted,
      observed: connectedObserved.length > 0 || this._bandwidthObserved || this._reliabilityObserved || this._quantumEncryptionObserved,
      bandwidthSource: this._bandwidthObserved ? 'OBSERVED' : 'UNOBSERVED',
      reliabilitySource: this._reliabilityObserved ? 'OBSERVED' : 'UNOBSERVED',
      encryptionSource: this._quantumEncryptionObserved ? 'OBSERVED' : 'UNOBSERVED',
    };
  }

  getNodes(): MeshNode[] {
    return Array.from(this.meshNetwork.values()).map(node => ({ ...node }));
  }
}
