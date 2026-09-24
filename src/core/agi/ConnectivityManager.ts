/**
 * Advanced Connectivity Manager
 * Origem: aeternum-core-self
 * 
 * Gerencia conectividade mesh, IoT e networking quântico
 * entre os subsistemas AGI.
 */

export interface MeshNode {
  id: string;
  type: string;
  status: 'connected' | 'disconnected' | 'syncing';
  latency: number;
  lastSeen: number;
}

export interface ConnectivityMetrics {
  meshNodes: number;
  avgLatency: number;
  bandwidth: number; // Mbps observed; 0 means unavailable
  reliability: number; // 0-1 observed from registered nodes
  iotDevices: number;
  quantumEncrypted: boolean;
}

export class ConnectivityManager {
  private meshNetwork: Map<string, MeshNode> = new Map();
  private _initialized = false;
  private _running = false;
  private _tickInterval: ReturnType<typeof setInterval> | null = null;
  private _bandwidth = 0; // Mbps; no measurement is claimed until provided
  private _reliability = 0;
  private _quantumEncrypted = false;

  get initialized(): boolean { return this._initialized; }
  get isRunning(): boolean { return this._running; }

  initialize(): void {
    if (this._initialized) return;

    // Auto-register AGI subsystems as mesh nodes
    const subsystems = [
      'consciousness', 'godel', 'darwin', 'lattice',
      'safeCore', 'selfHealing', 'ethics', 'hyperSafety',
      'nip', 'quantumNeural'
    ];

    subsystems.forEach(id => {
      this.meshNetwork.set(id, {
        id,
        type: 'agi-subsystem',
        status: 'connected',
        latency: 0,
        lastSeen: Date.now()
      });
    });

    this._initialized = true;
  }

  start(tickMs: number = 5000): void {
    if (this._running) return;
    this._running = true;

    this._tickInterval = setInterval(() => {
      this.tick();
    }, tickMs);
  }

  stop(): void {
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
    this._running = false;
  }

  private tick(): void {
    for (const node of this.meshNetwork.values()) {
      if (node.status === 'connected') node.lastSeen = Date.now();
    }
    const total = this.meshNetwork.size;
    const connected = Array.from(this.meshNetwork.values()).filter(node => node.status === 'connected').length;
    this._reliability = total > 0 ? connected / total : 0;
  }

  registerNode(id: string, type: string): void {
    this.meshNetwork.set(id, {
      id, type,
      status: 'connected',
      latency: 0,
      lastSeen: Date.now()
    });
  }

  getMetrics(): ConnectivityMetrics {
    const nodes = Array.from(this.meshNetwork.values());
    const connected = nodes.filter(n => n.status === 'connected');
    
    return {
      meshNodes: nodes.length,
      avgLatency: connected.length > 0
        ? connected.reduce((s, n) => s + n.latency, 0) / connected.length
        : 0,
      bandwidth: this._bandwidth,
      reliability: this._reliability,
      iotDevices: 0, // No real IoT in browser
      quantumEncrypted: this._quantumEncrypted
    };
  }

  getNodes(): MeshNode[] {
    return Array.from(this.meshNetwork.values());
  }

/** Record a real transport measurement supplied by the active adapter. */
  recordTransportMetrics(metrics: { bandwidthMbps?: number; reliability?: number }): void {
    if (metrics.bandwidthMbps !== undefined && Number.isFinite(metrics.bandwidthMbps) && metrics.bandwidthMbps >= 0) {
      this._bandwidth = metrics.bandwidthMbps;
    }
    if (metrics.reliability !== undefined && Number.isFinite(metrics.reliability) && metrics.reliability >= 0 && metrics.reliability <= 1) {
      this._reliability = metrics.reliability;
    }
  }

  setQuantumEncryptionStatus(enabled: boolean): void {
    this._quantumEncrypted = Boolean(enabled);
  }
}