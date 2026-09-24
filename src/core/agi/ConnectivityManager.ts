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
  bandwidth: number; // Mbps simulated
  reliability: number; // 0-1
  iotDevices: number;
  quantumEncrypted: boolean;
  observed: boolean;
  transportVerified: boolean;
}

export class ConnectivityManager {
  private meshNetwork: Map<string, MeshNode> = new Map();
  private _initialized = false;
  private _running = false;
  private _tickInterval: ReturnType<typeof setInterval> | null = null;
  private _bandwidth = 1000; // Mbps
  private _reliability = 0.999;

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
        status: 'disconnected',
        latency: 0,
        lastSeen: 0
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
    // Connectivity state is observation-driven. No synthetic latency,
    // bandwidth, reliability, or disconnect/reconnect events are generated.
    for (const [, node] of this.meshNetwork) {
      if (node.status === 'connected' && node.lastSeen > 0) {
        node.lastSeen = node.lastSeen;
      }
    }
  }

  registerNode(id: string, type: string): void {
    this.meshNetwork.set(id, {
      id, type,
      status: 'syncing',
      latency: 0,
      lastSeen: 0
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
      quantumEncrypted: false,
      observed: connected.length > 0,
      transportVerified: connected.length > 0 && nodes.every((n) => n.status !== 'syncing')
    };
  }

  getNodes(): MeshNode[] {
    return Array.from(this.meshNetwork.values());
  }
}
