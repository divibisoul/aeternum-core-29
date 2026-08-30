import { SoulNeuralGraph, type NeuralSignal, type NeuralRoute, type SoulNucleusId } from './SoulNeuralGraph';
import { SoulSuperGPU, type SuperGPUResult, type SuperGPUTask } from './SoulSuperGPU';
import { SoulCognitiveFabric, type AgentDescriptor, type Evidence, type WorldFact } from './SoulCognitiveFabric';

export type CognitiveGoal = {
  id: string;
  description: string;
  priority: number;
  deadline?: number;
  requiredCapabilities?: readonly string[];
  context?: unknown;
};

export type WorkingMemoryItem = {
  id: string;
  value: unknown;
  salience: number;
  expiresAt?: number;
  source?: SoulNucleusId;
};

export type ExecutiveDecision = {
  goalId: string;
  selectedNucleus?: SoulNucleusId;
  selectedCapability?: string;
  routes: readonly NeuralRoute[];
  inhibited: boolean;
  reason: string;
};

export type CortexSnapshot = {
  role: 'neocortex-prefrontal-executive-layer';
  workingMemory: number;
  goals: number;
  neuralSignals: number;
  activeNuclei: number;
  gpuFabric: ReturnType<SoulSuperGPU['describe']>;
  gpuFedSignals: number;
  cognitiveFabric: ReturnType<SoulCognitiveFabric['describe']>;
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export class NeoCortexPrefrontal {
  private readonly goals = new Map<string, CognitiveGoal>();
  private readonly workingMemory = new Map<string, WorkingMemoryItem>();
  private readonly graph: SoulNeuralGraph;
  private readonly superGPU: SoulSuperGPU;
  private readonly cognitiveFabric = new SoulCognitiveFabric();
  private gpuFedSignals = 0;
  private inhibitionThreshold = 0.15;

  constructor(graph: SoulNeuralGraph, superGPU: SoulSuperGPU) {
    this.graph = graph;
    this.superGPU = superGPU;
    this.ingestSuperGPUCapabilityMap();
  }

  setInhibitionThreshold(value: number): void { this.inhibitionThreshold = clamp(value); }

  addGoal(goal: CognitiveGoal): void {
    if (!goal.id.trim() || !goal.description.trim()) throw new Error('INVALID_COGNITIVE_GOAL');
    this.goals.set(goal.id, { ...goal, priority: clamp(goal.priority) });
    this.cognitiveFabric.remember(`goal:${goal.id}`, 'WORKING', goal, goal.priority, 'N01');
  }

  remember(item: WorkingMemoryItem): void {
    if (!item.id.trim()) throw new Error('INVALID_WORKING_MEMORY_ID');
    this.workingMemory.set(item.id, { ...item, salience: clamp(item.salience) });
    this.cognitiveFabric.remember(item.id, 'WORKING', item.value, item.salience, item.source);
  }

  forgetExpired(now = Date.now()): void {
    for (const [id, item] of this.workingMemory) if (item.expiresAt !== undefined && item.expiresAt <= now) this.workingMemory.delete(id);
  }

  registerAgent(agent: AgentDescriptor): void { this.cognitiveFabric.registerAgent(agent); }
  addWorldFact(fact: WorldFact): void { this.cognitiveFabric.addFact(fact); }
  addEvidence(key: string, evidence: Evidence): void { this.cognitiveFabric.addEvidence(key, evidence); }
  evaluateConsensus(key: string): ReturnType<SoulCognitiveFabric['consensus']> { return this.cognitiveFabric.consensus(key); }
  attention(items: readonly { id: string; salience: number; urgency?: number; confidence?: number }[], limit: number): readonly string[] { return this.cognitiveFabric.attention(items, limit); }

  ingestSuperGPUCapabilityMap(): number {
    const signals = this.superGPU.feedCapabilityMap();
    signals.forEach((input) => {
      const signal: NeuralSignal = { id: `gpu:capability:${input.source}:${input.timestamp}`, source: input.source, kind: input.signal, activation: input.activation, features: input.features, payload: input.payload, timestamp: input.timestamp };
      this.graph.propagate(signal);
      this.cognitiveFabric.addEvidence(`capability:${input.source}`, { source: 'SUPERGPU', value: input.payload, confidence: input.activation, timestamp: input.timestamp });
    });
    this.gpuFedSignals += signals.length;
    return signals.length;
  }

  ingestSuperGPUResults(results: readonly SuperGPUResult[]): number {
    const feed = this.superGPU.feedPrefrontalCortex(results);
    feed.signals.forEach((input) => {
      const signal: NeuralSignal = { id: `gpu:result:${input.source}:${input.timestamp}:${input.features[0] ?? 'result'}`, source: input.source, kind: input.signal, activation: input.activation, features: input.features, payload: input.payload, timestamp: input.timestamp };
      this.graph.propagate(signal);
      this.remember({ id: signal.id, value: signal.payload, salience: signal.activation, source: signal.source });
    });
    this.gpuFedSignals += feed.signals.length;
    return feed.signals.length;
  }

  decide(goalId: string, capability?: string): ExecutiveDecision {
    this.ingestSuperGPUCapabilityMap();
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error(`GOAL_NOT_FOUND:${goalId}`);
    const selectedCapability = capability ?? goal.requiredCapabilities?.[0];
    const signal: NeuralSignal = { id: `goal:${goal.id}`, source: 'N01', kind: 'GOAL', activation: goal.priority, features: goal.requiredCapabilities ?? [], payload: goal.context, timestamp: Date.now() };
    const routes = this.graph.propagate(signal, selectedCapability);
    const candidates = selectedCapability ? this.cognitiveFabric.resolveCapability(selectedCapability) : [];
    const best = candidates[0] && routes.find((route) => route.target === candidates[0].nucleus) ? routes.find((route) => route.target === candidates[0].nucleus) : routes[0];
    const evidence = selectedCapability ? this.cognitiveFabric.consensus(`capability:${best?.target ?? 'N01'}`) : { confidence: 0, sources: 0, conflict: false };
    const meta = this.cognitiveFabric.metacognition(best?.weight ?? 0, evidence.confidence, evidence.conflict);
    const inhibited = !best || best.weight < this.inhibitionThreshold || meta.shouldAskForHelp;
    return { goalId, selectedNucleus: inhibited ? undefined : best?.target, selectedCapability, routes, inhibited, reason: inhibited ? meta.reason : best?.reason ?? 'no-route' };
  }

  async execute(tasks: readonly SuperGPUTask[]): Promise<readonly SuperGPUResult[]> {
    if (tasks.length === 0) return [];
    const results = await this.superGPU.executeParallel(tasks);
    this.ingestSuperGPUResults(results);
    results.forEach((result) => this.cognitiveFabric.observe({ id: result.taskId, nucleus: result.nucleus, capability: tasks.find((task) => task.id === result.taskId)?.capability ?? 'unknown', success: true, confidence: 1, latencyMs: result.finishedAt - result.startedAt, timestamp: result.finishedAt, context: result.output }));
    return results;
  }

  describe(): CortexSnapshot {
    const graph = this.graph.describe();
    return { role: 'neocortex-prefrontal-executive-layer', workingMemory: this.workingMemory.size, goals: this.goals.size, neuralSignals: graph.signals, activeNuclei: graph.nodes.filter((node) => node.available).length, gpuFabric: this.superGPU.describe(), gpuFedSignals: this.gpuFedSignals, cognitiveFabric: this.cognitiveFabric.describe() };
  }
}
