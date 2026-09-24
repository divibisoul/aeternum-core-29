/**
 * Quantum Neural Interface - boundary for optional physical quantum/neural
 * integrations.
 *
 * The project does not claim physical quantum hardware. Without a registered
 * physical backend, all quantum capabilities remain explicitly unavailable.
 * Existing method names are preserved for compatibility.
 */

export interface NeuralSignal {
  type: 'eeg' | 'thought' | 'emotion' | 'command';
  strength: number;
  frequency: number;
  timestamp: number;
  processed: boolean;
  source?: 'EXTERNAL_SENSOR' | 'DERIVED_FROM_TEXT';
}

export interface QuantumState {
  entangled: boolean;
  coherence: number;
  fidelity: number;
  errorRate: number;
  physicalBackendConfigured: boolean;
  stateSource: 'PHYSICAL_BACKEND' | 'UNAVAILABLE';
  observedAt: number;
}

export class NeuralCommunication {
  private isActive = false;
  private signals: NeuralSignal[] = [];
  private thoughtRecognitionAccuracy: number | null = null;

  enableEEGMonitoring(): void {
    this.isActive = true;
  }

  setupThoughtRecognition(): void {
    this.thoughtRecognitionAccuracy = null;
  }

  processNeuralSignal(signal: Omit<NeuralSignal, 'timestamp' | 'processed'>): NeuralSignal {
    const processedSignal: NeuralSignal = {
      ...signal,
      timestamp: Date.now(),
      processed: true,
    };
    this.signals.push(processedSignal);
    if (this.signals.length > 500) this.signals = this.signals.slice(-250);
    return processedSignal;
  }

  getRecentSignals(count = 10): NeuralSignal[] {
    return this.signals.slice(-Math.max(0, count));
  }

  getNeuralMetrics() {
    const recent = this.signals.slice(-50);
    return {
      isActive: this.isActive,
      signalCount: this.signals.length,
      thoughtAccuracy: this.thoughtRecognitionAccuracy,
      averageStrength: recent.length > 0
        ? recent.reduce((sum, s) => sum + s.strength, 0) / recent.length
        : null,
      averageFrequency: recent.length > 0
        ? recent.reduce((sum, s) => sum + s.frequency, 0) / recent.length
        : null,
    };
  }
}

export class QuantumNetworking {
  private quantumState: QuantumState = {
    entangled: false,
    coherence: 0,
    fidelity: 0,
    errorRate: 1,
    physicalBackendConfigured: false,
    stateSource: 'UNAVAILABLE',
    observedAt: 0,
  };

  setupPhysicalBackend(status: {
    configured: boolean;
    coherence?: number;
    fidelity?: number;
    errorRate?: number;
    observedAt?: number;
  }): void {
    if (!status.configured) {
      this.quantumState.physicalBackendConfigured = false;
      this.quantumState.stateSource = 'UNAVAILABLE';
      this.quantumState.entangled = false;
      this.quantumState.observedAt = 0;
      return;
    }

    this.quantumState.physicalBackendConfigured = true;
    this.quantumState.stateSource = 'PHYSICAL_BACKEND';
    this.updateObservedState(status);
  }

  private updateObservedState(status: {
    configured: boolean;
    coherence?: number;
    fidelity?: number;
    errorRate?: number;
    observedAt?: number;
  }): void {
    if (!status.configured) return;
    const coherence = status.coherence;
    const fidelity = status.fidelity;
    const errorRate = status.errorRate;

    if (Number.isFinite(coherence) && Number.isFinite(fidelity) && Number.isFinite(errorRate)) {
      this.quantumState.coherence = Math.max(0, Math.min(1, coherence!));
      this.quantumState.fidelity = Math.max(0, Math.min(1, fidelity!));
      this.quantumState.errorRate = Math.max(0, Math.min(1, errorRate!));
      this.quantumState.observedAt = status.observedAt ?? Date.now();
    }
  }

  setupQuantumKeyDistribution(): void {
    // Capability request retained; no physical operation is claimed.
  }

  enableQuantumTeleportation(): void {
    // Capability request retained; entanglement stays false without backend evidence.
  }

  implementQuantumErrorCorrection(): void {
    // Capability request retained; no physical state is fabricated.
  }

  prepareForQuantumInternet(): void {
    // Capability request retained; no physical network is fabricated.
  }

  establishQuantumEntanglement(_nodeId: string): boolean {
    if (!this.quantumState.physicalBackendConfigured) return false;
    this.quantumState.entangled = true;
    this.quantumState.observedAt = Date.now();
    return true;
  }

  tick(): void {
    // No synthetic decoherence/correction. A physical adapter must push observations.
  }

  getQuantumMetrics() {
    return {
      ...this.quantumState,
      entangledNodes: this.quantumState.entangled ? 1 : 0,
    };
  }
}

export class QuantumNeuralInterface {
  public neural: NeuralCommunication;
  public quantum: QuantumNetworking;

  private isInitialized = false;
  private hybridMode = false;
  private _tickInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.neural = new NeuralCommunication();
    this.quantum = new QuantumNetworking();
  }

  initialize(): void {
    if (this.isInitialized) return;

    this.neural.enableEEGMonitoring();
    this.neural.setupThoughtRecognition();

    this.quantum.setupQuantumKeyDistribution();
    this.quantum.enableQuantumTeleportation();
    this.quantum.implementQuantumErrorCorrection();
    this.quantum.prepareForQuantumInternet();

    this.hybridMode = this.quantum.getQuantumMetrics().physicalBackendConfigured;
    this.isInitialized = true;
  }

  startContinuousTick(intervalMs = 5000): void {
    if (this._tickInterval) return;
    this._tickInterval = setInterval(() => this.quantum.tick(), Math.max(250, intervalMs));
  }

  stopContinuousTick(): void {
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
  }

  processMessage(message: string): {
    neuralSignal: NeuralSignal;
    quantumCoherence: number;
    quantumFidelity: number;
    hybridActive: boolean;
  } {
    const strength = Math.min(1, Math.max(0, message.length / 200));
    const frequency = (message.split(/\s+/).filter(Boolean).length / 20) * 40;

    const signal = this.neural.processNeuralSignal({
      type: 'thought',
      strength,
      frequency,
      source: 'DERIVED_FROM_TEXT',
    });

    const qm = this.quantum.getQuantumMetrics();
    return {
      neuralSignal: signal,
      quantumCoherence: qm.coherence,
      quantumFidelity: qm.fidelity,
      hybridActive: this.hybridMode,
    };
  }

  establishEntanglement(subsystemId: string): boolean {
    return this.quantum.establishQuantumEntanglement(subsystemId);
  }

  getInterfaceStatus() {
    return {
      initialized: this.isInitialized,
      hybridMode: this.hybridMode,
      neural: this.neural.getNeuralMetrics(),
      quantum: this.quantum.getQuantumMetrics(),
    };
  }
}
