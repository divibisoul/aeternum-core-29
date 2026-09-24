export type SoulNucleusId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06' | 'N07';
export type ComputeBackend = 'IN_PROCESS' | 'WEBASSEMBLY' | 'WEBGPU' | 'REMOTE_MESH';
export type SuperGPUNode = { nucleus: SoulNucleusId; capabilities: readonly string[]; backends: readonly ComputeBackend[]; capacity: number; available: boolean };
export type SuperGPUTask = { id: string; capability: string; payload: unknown; preferredNucleus?: SoulNucleusId; estimatedCost?: number; dependencies?: readonly string[] };
export type SuperGPUExecutor = (task: SuperGPUTask, backend: ComputeBackend, nucleus: SoulNucleusId) => Promise<unknown>;
export type SuperGPUResult = { taskId: string; nucleus: SoulNucleusId; backend: ComputeBackend; output?: unknown; error?: string; success: boolean; startedAt: number; finishedAt: number };
export type PrefrontalInput = { source: SoulNucleusId; signal: 'GOAL' | 'CONTEXT' | 'CAPABILITY' | 'RESULT' | 'ERROR' | 'FEEDBACK'; activation: number; features: readonly string[]; payload: unknown; timestamp: number };
export type PrefrontalFeed = { generatedAt: number; source: 'SUPERGPU'; signals: readonly PrefrontalInput[]; results: readonly SuperGPUResult[] };

const DEFAULT_BACKENDS: readonly ComputeBackend[] = ['IN_PROCESS', 'WEBASSEMBLY', 'WEBGPU', 'REMOTE_MESH'];
const NUCLEI: readonly SoulNucleusId[] = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07'];
const clamp = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

export class SoulSuperGPU {
  private readonly nodes = new Map<SoulNucleusId, SuperGPUNode>();
  private readonly executors = new Map<ComputeBackend, SuperGPUExecutor>();

  registerNode(node: SuperGPUNode): void {
    if (!NUCLEI.includes(node.nucleus)) throw new Error(`INVALID_SOUL_NUCLEUS:${node.nucleus}`);
    if (!Number.isFinite(node.capacity) || node.capacity <= 0) throw new Error('INVALID_NODE_CAPACITY');
    this.nodes.set(node.nucleus, { ...node, capabilities: [...new Set(node.capabilities)], backends: [...new Set(node.backends)], capacity: clamp(node.capacity), available: Boolean(node.available) });
  }

  registerExecutor(backend: ComputeBackend, executor: SuperGPUExecutor): void {
    if (!DEFAULT_BACKENDS.includes(backend)) throw new Error(`UNSUPPORTED_BACKEND:${backend}`);
    this.executors.set(backend, executor);
  }

  resolve(task: SuperGPUTask): { nucleus: SoulNucleusId; backend: ComputeBackend } {
    if (!task.id.trim() || !task.capability.trim()) throw new Error('INVALID_SUPERGPU_TASK');
    const candidates = [...this.nodes.values()].filter((node) => node.available && node.capabilities.includes(task.capability) && node.backends.some((backend) => this.executors.has(backend))).sort((a, b) => {
      if (task.preferredNucleus) { const ap = a.nucleus === task.preferredNucleus ? 1 : 0; const bp = b.nucleus === task.preferredNucleus ? 1 : 0; if (ap !== bp) return bp - ap; }
      return b.capacity - a.capacity;
    });
    const node = candidates[0];
    if (!node) throw new Error(`CAPABILITY_UNAVAILABLE_OR_NO_EXECUTOR:${task.capability}`);
    const backend = node.backends.find((candidate) => this.executors.has(candidate));
    if (!backend) throw new Error(`NO_EXECUTOR_AVAILABLE:${node.nucleus}:${task.capability}`);
    return { nucleus: node.nucleus, backend };
  }

  async execute(task: SuperGPUTask): Promise<SuperGPUResult> {
    const resolved = this.resolve(task);
    const executor = this.executors.get(resolved.backend)!;
    const startedAt = Date.now();
    try {
      const output = await executor(task, resolved.backend, resolved.nucleus);
      return { taskId: task.id, nucleus: resolved.nucleus, backend: resolved.backend, output, success: true, startedAt, finishedAt: Date.now() };
    } catch (error) {
      return { taskId: task.id, nucleus: resolved.nucleus, backend: resolved.backend, error: error instanceof Error ? error.message : String(error), success: false, startedAt, finishedAt: Date.now() };
    }
  }

  async executeParallel(tasks: readonly SuperGPUTask[]): Promise<readonly SuperGPUResult[]> {
    const ids = tasks.map((task) => task.id);
    if (new Set(ids).size !== ids.length) throw new Error('SUPERGPU_DUPLICATE_TASK_ID');
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const completed = new Map<string, SuperGPUResult>();
    const pending = new Set(tasks.map((task) => task.id));
    while (pending.size > 0) {
      const ready = [...pending].map((id) => byId.get(id)!).filter((task) => (task.dependencies ?? []).every((dependency) => completed.get(dependency)?.success === true));
      const blocked = [...pending].map((id) => byId.get(id)!).filter((task) => (task.dependencies ?? []).some((dependency) => completed.has(dependency) && completed.get(dependency)?.success === false));
      blocked.forEach((task) => { completed.set(task.id, { taskId: task.id, nucleus: task.preferredNucleus ?? 'N01', backend: 'REMOTE_MESH', error: 'DEPENDENCY_FAILED', success: false, startedAt: Date.now(), finishedAt: Date.now() }); pending.delete(task.id); });
      if (ready.length === 0) { if (pending.size === 0) break; throw new Error('SUPERGPU_DEPENDENCY_CYCLE_OR_MISSING_DEPENDENCY'); }
      const wave = await Promise.all(ready.map((task) => this.execute(task)));
      wave.forEach((result) => { completed.set(result.taskId, result); pending.delete(result.taskId); });
    }
    return tasks.map((task) => completed.get(task.id)!);
  }

  feedPrefrontalCortex(results: readonly SuperGPUResult[]): PrefrontalFeed {
    const signals: PrefrontalInput[] = results.map((result) => ({ source: result.nucleus, signal: result.success ? 'RESULT' : 'ERROR', activation: result.success ? 1 : 0.9, features: [result.taskId, result.backend], payload: result.success ? result.output : { error: result.error }, timestamp: result.finishedAt }));
    return { generatedAt: Date.now(), source: 'SUPERGPU', signals, results };
  }

  feedCapabilityMap(): readonly PrefrontalInput[] {
    return [...this.nodes.values()].filter((node) => node.available).map((node) => ({ source: node.nucleus, signal: 'CAPABILITY' as const, activation: clamp(node.capacity), features: node.capabilities, payload: { capacity: node.capacity, backends: node.backends }, timestamp: Date.now() }));
  }

  describe(): { mode: 'federated-software-fabric'; nuclei: readonly SoulNucleusId[]; backends: readonly ComputeBackend[]; nodes: readonly SuperGPUNode[]; parallel: true; hardwareGpu: false; feedsPrefrontalCortex: true } { return { mode: 'federated-software-fabric', nuclei: NUCLEI, backends: DEFAULT_BACKENDS, nodes: [...this.nodes.values()], parallel: true, hardwareGpu: false, feedsPrefrontalCortex: true }; }
}

export function createDefaultSuperGPU(nodes: readonly SuperGPUNode[] = []): SoulSuperGPU { const fabric = new SoulSuperGPU(); nodes.forEach((node) => fabric.registerNode(node)); return fabric; }
