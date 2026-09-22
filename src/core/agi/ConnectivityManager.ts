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
  bandwidth: number; // Mbps observado; 0 = não medido
  reliability: number; // 0-1 observado; 0 = não medido
  iotDevices: number;
  quantumEncrypted: boolean;
  measurementSource: 'OBSERVED' | 'UNMEASURED';
  lastMeasurement: number;
}

export class ConnectivityManager {
  private meshNetwork: Map<string, MeshNode> = new Map();
  private _initialized = false;
  private _running = false;
  private _tickInterval: ReturnType<typeof setInterval> | null = null;
  private _bandwidth = 0; // Mbps observado
  private _reliability = 0;

  get initialized(): boolean { return this._initialized; }
  get isRunning(): boolean { return this._running; }

  initialize(): void {
    if (this._initialized) return;

    // Registro automático foi removido: uma entrada local não prova conectividade.
    // Nós reais entram por registerNode() e só passam a connected após heartbeat/medição.
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
    const now = Date.now();
    const staleThresholdMs = 15_000;
    for (const node of this.meshNetwork.values()) {
      if (now - node.lastSeen > staleThresholdMs) {
        node.status = 'disconnected';
      }
    }
  }

  recordNodeHeartbeat(
    id: string,
    latencyMs: number,
    bandwidthMbps?: number,
    reliability?: number,
  ): boolean {
    const node = this.meshNetwork.get(id);
    if (!node || !Number.isFinite(latencyMs) || latencyMs < 0) return false;
    node.latency = latencyMs;
    node.lastSeen = Date.now();
    node.status = 'connected';
    if (bandwidthMbps != null && Number.isFinite(bandwidthMbps) && bandwidthMbps >= 0) {
      this._bandwidth = bandwidthMbps;
    }
    if (reliability != null && Number.isFinite(reliability)) {
      this._reliability = Math.max(0, Math.min(1, reliability));
    }
    return true;
  }

  registerNode(id: string, type: string): void {
    this.meshNetwork.set(id, {
      id, type,
      status: 'syncing',
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
      iotDevices: 0,
      quantumEncrypted: false,
      measurementSource: this._bandwidth > 0 || this._reliability > 0 ? 'OBSERVED' : 'UNMEASURED',
      lastMeasurement: nodes.reduce((latest, n) => Math.max(latest, n.lastSeen), 0)
    };
  }

  getNodes(): MeshNode[] {
    return Array.from(this.meshNetwork.values());
  }
}
