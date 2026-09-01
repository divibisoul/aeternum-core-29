import crypto from 'node:crypto';

const BACKENDS = ['IN_PROCESS', 'WEBASSEMBLY', 'WEBGPU', 'REMOTE_MESH'];
const NUCLEI = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'];

export function createSuperGPU({ resolveOwner, forward, self = 'N01' }) {
  if (typeof resolveOwner !== 'function' || typeof forward !== 'function') throw new Error('SUPERGPU_DEPENDENCIES_REQUIRED');

  function resolve(task) {
    if (!task || typeof task !== 'object' || typeof task.id !== 'string' || !task.id.trim() || typeof task.capability !== 'string' || !task.capability.trim()) throw new Error('INVALID_SUPERGPU_TASK');
    const owner = resolveOwner(task.capability);
    if (!owner || !NUCLEI.includes(owner)) throw new Error(`CAPABILITY_UNAVAILABLE:${task.capability}`);
    return { taskId: task.id, capability: task.capability, owner, backend: owner === self ? 'IN_PROCESS' : 'REMOTE_MESH' };
  }

  function dependenciesOf(task) {
    const dependencies = task?.dependencies ?? task?.dependsOn ?? [];
    if (!Array.isArray(dependencies) || dependencies.some((dependency) => typeof dependency !== 'string' || !dependency.trim())) {
      throw new Error(`INVALID_SUPERGPU_DEPENDENCIES:${task?.id || 'unknown'}`);
    }
    return dependencies;
  }

  async function execute(task, correlationId) {
    const plan = resolve(task);
    const startedAt = Date.now();
    if (plan.owner === self) {
      return { ...plan, execution: 'local', output: { owner: self, capability: plan.capability, payload: task.payload }, startedAt, finishedAt: Date.now(), durationMs: Date.now() - startedAt };
    }
    const message = {
      protocol: 'soul-mesh/1',
      id: crypto.randomUUID(),
      correlationId: correlationId || crypto.randomUUID(),
      source: self,
      target: plan.owner,
      kind: 'request',
      capability: plan.capability,
      payload: task.payload,
      timestamp: Date.now(),
    };
    const output = await forward(plan.owner, message);
    return { ...plan, execution: 'remote', output, startedAt, finishedAt: Date.now(), durationMs: Date.now() - startedAt };
  }

  async function executeParallel(tasks, correlationId) {
    if (!Array.isArray(tasks) || tasks.length === 0) throw new Error('SUPERGPU_TASKS_REQUIRED');
    const byId = new Map(tasks.map((task) => [task.id, task]));
    if (byId.size !== tasks.length) throw new Error('SUPERGPU_DUPLICATE_TASK_ID');
    tasks.forEach((task) => { resolve(task); dependenciesOf(task).forEach((dependency) => { if (!byId.has(dependency)) throw new Error(`SUPERGPU_MISSING_DEPENDENCY:${task.id}:${dependency}`); }); });
    const completed = new Map();
    const pending = new Set(tasks.map((task) => task.id));
    while (pending.size) {
      const ready = [...pending].map((id) => byId.get(id)).filter((task) => dependenciesOf(task).every((dependency) => completed.has(dependency)));
      if (!ready.length) throw new Error('SUPERGPU_DEPENDENCY_CYCLE_OR_MISSING_DEPENDENCY');
      const wave = await Promise.all(ready.map((task) => execute(task, correlationId)));
      wave.forEach((result) => { completed.set(result.taskId, result); pending.delete(result.taskId); });
    }
    return tasks.map((task) => completed.get(task.id));
  }

  function describe() {
    return {
      mode: 'federated-software-fabric',
      hardwareGpu: false,
      parallel: true,
      nuclei: NUCLEI,
      backends: BACKENDS,
      scheduler: 'dependency-aware-capability-owner',
      nativeOwnership: true,
      remoteExecution: true,
      timing: { perTaskDurationMs: true, dependencyAware: true },
    };
  }

  return { resolve, execute, executeParallel, describe };
}
