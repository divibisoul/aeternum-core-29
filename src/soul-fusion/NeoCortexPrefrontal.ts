import { SoulNeuralGraph, type NeuralSignal, type NeuralRoute, type SoulNucleusId } from './SoulNeuralGraph';
import { SoulSuperGPU, type SuperGPUResult, type SuperGPUTask } from './SoulSuperGPU';

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
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export class NeoCortexPrefrontal {
  private readonly goals = new Map<string, CognitiveGoal>();
  private readonly workingMemory = new Map<string, WorkingMemoryItem>();
  private readonly graph: SoulNeuralGraph;
  private readonly superGPU: SoulSuperGPU;
  private inhibitionThreshold = 0.15;

  constructor(graph: SoulNeuralGraph, superGPU: SoulSuperGPU) {
    this.graph = graph;
    this.superGPU = superGPU;
  }

  setInhibitionThreshold(value: number): void {
    this.inhibitionThreshold = clamp(value);
  }

  addGoal(goal: CognitiveGoal): void {
    if (!goal.id.trim() || !goal.description.trim()) throw new Error('INVALID_COGNITIVE_GOAL');
    this.goals.set(goal.id, { ...goal, priority: clamp(goal.priority) });
  }

  remember(item: WorkingMemoryItem): void {
    if (!item.id.trim()) throw new Error('INVALID_WORKING_MEMORY_ID');
    this.workingMemory.set(item.id, { ...item, salience: clamp(item.salience) });
  }

  forgetExpired(now = Date.now()): void {
    for (const [id, item] of this.workingMemory) {
      if (item.expiresAt !== undefined && item.expiresAt <= now) this.workingMemory.delete(id);
    }
  }

  decide(goalId: string, capability?: string): ExecutiveDecision {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error(`GOAL_NOT_FOUND:${goalId}`);

    const signal: NeuralSignal = {
      id: `goal:${goal.id}`,
      source: 'N01',
      kind: 'GOAL',
      activation: goal.priority,
      features: goal.requiredCapabilities ?? [],
      payload: goal.context,
      timestamp: Date.now(),
    };

    const routes = this.graph.propagate(signal, capability ?? goal.requiredCapabilities?.[0]);
    const best = routes[0];
    const inhibited = !best || best.weight < this.inhibitionThreshold;

    return {
      goalId,
      selectedNucleus: inhibited ? undefined : best.target,
      selectedCapability: capability ?? goal.requiredCapabilities?.[0],
      routes,
      inhibited,
      reason: inhibited ? 'insufficient-confidence-or-availability' : best.reason,
    };
  }

  async execute(tasks: readonly SuperGPUTask[]): Promise<readonly SuperGPUResult[]> {
    if (tasks.length === 0) return [];
    return this.superGPU.executeParallel(tasks);
  }

  describe(): CortexSnapshot {
    const graph = this.graph.describe();
    return {
      role: 'neocortex-prefrontal-executive-layer',
      workingMemory: this.workingMemory.size,
      goals: this.goals.size,
      neuralSignals: graph.signals,
      activeNuclei: graph.nodes.filter((node) => node.available).length,
      gpuFabric: this.superGPU.describe(),
    };
  }
}
