export type SoulNucleusId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06';
export type NeuralSignalKind = 'GOAL' | 'CONTEXT' | 'CAPABILITY' | 'RESULT' | 'ERROR' | 'FEEDBACK';
export type NeuralSignal = { id: string; source: SoulNucleusId; target?: SoulNucleusId; kind: NeuralSignalKind; activation: number; features: readonly string[]; payload?: unknown; fast_inference?: boolean; timestamp: number };
export type NeuralNode = { nucleus: SoulNucleusId; capabilities: readonly string[]; salience: number; load: number; available: boolean };
export type NeuralRoute = { source: SoulNucleusId; target: SoulNucleusId; weight: number; reason: string };
type LearnedEdge = { weight: number; attempts: number; successes: number; updatedAt: number };
const NUCLEI: readonly SoulNucleusId[] = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'];
const FAST_INFERENCE_NUCLEI: readonly SoulNucleusId[] = ['N02', 'N05'];
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

export class SoulNeuralGraph {
  private readonly nodes = new Map<SoulNucleusId, NeuralNode>();
  private readonly signals = new Map<string, NeuralSignal>();
  private readonly learnedEdges = new Map<string, LearnedEdge>();
  private readonly learningRate = 0.15;

  registerNode(node: NeuralNode): void { if (!NUCLEI.includes(node.nucleus)) throw new Error(`INVALID_SOUL_NUCLEUS:${node.nucleus}`); this.nodes.set(node.nucleus, { ...node, capabilities: [...new Set(node.capabilities)], salience: clamp(node.salience), load: clamp(node.load), available: Boolean(node.available) }); }
  emit(signal: NeuralSignal): void { if (!signal.id.trim()) throw new Error('INVALID_NEURAL_SIGNAL_ID'); if (!NUCLEI.includes(signal.source)) throw new Error(`INVALID_SIGNAL_SOURCE:${signal.source}`); this.signals.set(signal.id, { ...signal, activation: clamp(signal.activation), features: [...new Set(signal.features)], timestamp: signal.timestamp || Date.now() }); }
  getSignal(id: string): NeuralSignal | undefined { return this.signals.get(id); }

  route(signal: NeuralSignal, capability?: string): NeuralRoute[] {
    const candidates = [...this.nodes.values()].filter((node) => node.available && (!capability || node.capabilities.includes(capability)) && (node.nucleus !== signal.source || signal.target === signal.source));
    return candidates.map((node) => {
      const key = `${signal.source}->${node.nucleus}:${capability ?? '*'}`;
      const learned = this.learnedEdges.get(key);
      const capabilityMatch = capability && node.capabilities.includes(capability) ? 0.45 : 0;
      const attention = node.salience * 0.25;
      const availability = (1 - node.load) * 0.15;
      const targetBias = signal.target === node.nucleus ? 1 : 0;
      const fastInferenceBias = signal.fast_inference === true && FAST_INFERENCE_NUCLEI.includes(node.nucleus) ? 0.30 : 0;
      const learnedComponent = learned ? learned.weight * 0.30 : 0.15;
      const weight = clamp(capabilityMatch + attention + availability + targetBias * 0.5 + fastInferenceBias + learnedComponent);
      const reason = targetBias ? 'explicit-target' : fastInferenceBias > 0 ? 'fast-inference-groq-priority' : learned ? 'learned-capability-routing' : capabilityMatch ? 'capability-match' : 'distributed-attention';
      return { source: signal.source, target: node.nucleus, weight, reason };
    }).sort((a, b) => b.weight - a.weight);
  }

  propagate(signal: NeuralSignal, capability?: string): NeuralRoute[] { this.emit(signal); return this.route(signal, capability); }
  learn(source: SoulNucleusId, target: SoulNucleusId, capability: string, success: boolean, confidence = 1): void { if (!NUCLEI.includes(source) || !NUCLEI.includes(target) || !capability.trim()) throw new Error('INVALID_NEURAL_LEARNING_EVENT'); const key = `${source}->${target}:${capability}`; const current = this.learnedEdges.get(key) ?? { weight: 0.5, attempts: 0, successes: 0, updatedAt: 0 }; current.attempts += 1; if (success) current.successes += 1; const reward = success ? clamp(confidence) : -clamp(confidence); current.weight = clamp(current.weight + this.learningRate * reward); current.updatedAt = Date.now(); this.learnedEdges.set(key, current); }
  exportLearningState(): string { return JSON.stringify([...this.learnedEdges.entries()]); }
  importLearningState(serialized: string): void { const parsed: unknown = JSON.parse(serialized); if (!Array.isArray(parsed)) throw new Error('INVALID_NEURAL_LEARNING_STATE'); const next = new Map<string, LearnedEdge>(); for (const item of parsed) { if (!Array.isArray(item) || typeof item[0] !== 'string' || !item[1] || typeof item[1] !== 'object') throw new Error('INVALID_NEURAL_LEARNING_ENTRY'); const value = item[1] as Partial<LearnedEdge>; if (![value.weight, value.attempts, value.successes, value.updatedAt].every((v) => typeof v === 'number' && Number.isFinite(v))) throw new Error('INVALID_NEURAL_LEARNING_ENTRY'); next.set(item[0], { weight: clamp(value.weight), attempts: Math.max(0, value.attempts), successes: Math.max(0, value.successes), updatedAt: value.updatedAt }); } this.learnedEdges.clear(); next.forEach((value, key) => this.learnedEdges.set(key, value)); }
  describe(): { model: 'distributed-neural-graph'; messagePassing: true; learnedWeights: boolean; learnedEdges: number; nodes: readonly NeuralNode[]; signals: number } { return { model: 'distributed-neural-graph', messagePassing: true, learnedWeights: this.learnedEdges.size > 0, learnedEdges: this.learnedEdges.size, nodes: [...this.nodes.values()], signals: this.signals.size }; }
}
export { NUCLEI };
