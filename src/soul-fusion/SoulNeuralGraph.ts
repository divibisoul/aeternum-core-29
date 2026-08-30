export type SoulNucleusId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06';

export type NeuralSignalKind = 'GOAL' | 'CONTEXT' | 'CAPABILITY' | 'RESULT' | 'ERROR' | 'FEEDBACK';

export type NeuralSignal = {
  id: string;
  source: SoulNucleusId;
  target?: SoulNucleusId;
  kind: NeuralSignalKind;
  activation: number;
  features: readonly string[];
  payload?: unknown;
  timestamp: number;
};

export type NeuralNode = {
  nucleus: SoulNucleusId;
  capabilities: readonly string[];
  salience: number;
  load: number;
  available: boolean;
};

export type NeuralRoute = {
  source: SoulNucleusId;
  target: SoulNucleusId;
  weight: number;
  reason: string;
};

const NUCLEI: readonly SoulNucleusId[] = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'];

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export class SoulNeuralGraph {
  private readonly nodes = new Map<SoulNucleusId, NeuralNode>();
  private readonly signals = new Map<string, NeuralSignal>();

  registerNode(node: NeuralNode): void {
    if (!NUCLEI.includes(node.nucleus)) throw new Error(`INVALID_SOUL_NUCLEUS:${node.nucleus}`);
    this.nodes.set(node.nucleus, {
      ...node,
      capabilities: [...new Set(node.capabilities)],
      salience: clamp(node.salience),
      load: clamp(node.load),
    });
  }

  emit(signal: NeuralSignal): void {
    if (!signal.id.trim()) throw new Error('INVALID_NEURAL_SIGNAL_ID');
    if (!NUCLEI.includes(signal.source)) throw new Error(`INVALID_SIGNAL_SOURCE:${signal.source}`);
    this.signals.set(signal.id, { ...signal, activation: clamp(signal.activation) });
  }

  getSignal(id: string): NeuralSignal | undefined {
    return this.signals.get(id);
  }

  route(signal: NeuralSignal, capability?: string): NeuralRoute[] {
    const candidates = [...this.nodes.values()].filter((node) => {
      if (!node.available) return false;
      if (capability && !node.capabilities.includes(capability)) return false;
      return node.nucleus !== signal.source || signal.target === signal.source;
    });

    return candidates
      .map((node) => {
        const capabilityMatch = capability && node.capabilities.includes(capability) ? 0.45 : 0;
        const attention = node.salience * 0.35;
        const availability = (1 - node.load) * 0.2;
        const targetBias = signal.target === node.nucleus ? 1 : 0;
        const weight = clamp(capabilityMatch + attention + availability + targetBias);
        return {
          source: signal.source,
          target: node.nucleus,
          weight,
          reason: targetBias ? 'explicit-target' : capabilityMatch ? 'capability-match' : 'distributed-attention',
        };
      })
      .sort((a, b) => b.weight - a.weight);
  }

  propagate(signal: NeuralSignal, capability?: string): NeuralRoute[] {
    this.emit(signal);
    return this.route(signal, capability);
  }

  describe(): {
    model: 'distributed-neural-graph';
    messagePassing: true;
    learnedWeights: false;
    nodes: readonly NeuralNode[];
    signals: number;
  } {
    return {
      model: 'distributed-neural-graph',
      messagePassing: true,
      learnedWeights: false,
      nodes: [...this.nodes.values()],
      signals: this.signals.size,
    };
  }
}

export { NUCLEI };
