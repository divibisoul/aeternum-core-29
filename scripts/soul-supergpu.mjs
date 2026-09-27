import crypto from 'node:crypto';

const BACKENDS = ['IN_PROCESS', 'WEBASSEMBLY', 'WEBGPU', 'REMOTE_MESH'];
const NUCLEI = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07'];

export function createSuperGPU({ resolveOwner, forward, executeLocal, self = 'N01' }) {
  if (typeof resolveOwner !== 'function' || typeof forward !== 'function') throw new Error('SUPERGPU_DEPENDENCIES_REQUIRED');
  if (executeLocal !== undefined && typeof executeLocal !== 'function') throw new Error('SUPERGPU_LOCAL_EXECUTOR_INVALID');

  function resolve(task) {
    if (!task || typeof task !== 'object' || typeof task.id !== 'string' || !task.id.trim() || typeof task.capability !== 'string' || !task.capability.trim()) {
      throw new Error('INVALID_SUPERGPU_TASK');
    }
    const owner = resolveOwner(task.capability);
    if (!owner || !NUCLEI.includes(owner)) throw new Error(`CAPABILITY_UNAVAILABLE:${task.capability}`);
    return {
      taskId: task.id,
      capability: task.capability,
      owner,
      backend: owner === self ? 'IN_PROCESS' : 'REMOTE_MESH',
      configured: owner === self || Boolean(task?.configured),
    };
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
    const effectiveCorrelationId = correlationId || crypto.randomUUID();

    if (plan.owner === self) {
      if (typeof executeLocal !== 'function') {
        throw new Error(`SUPERGPU_LOCAL_HANDLER_UNAVAILABLE:${plan.capability}`);
      }
      const output = await executeLocal(task, effectiveCorrelationId, plan);
      return {
        ...plan,
        correlationId: effectiveCorrelationId,
        execution: 'local',
        output,
        startedAt,
        finishedAt: Date.now(),
        durationMs: Date.now() - startedAt,
      };
    }

    const message = {
      protocol: 'soul-mesh/1',
      contractVersion: '1.1.0',
      id: crypto.randomUUID(),
      correlationId: effectiveCorrelationId,
      source: self,
      target: plan.owner,
      kind: 'request',
      capability: plan.capability,
      payload: task.payload,
      timestamp: Date.now(),
    };
    const output = await forward(plan.owner, message);
    return {
      ...plan,
      correlationId: effectiveCorrelationId,
      execution: 'remote',
      output,
      startedAt,
      finishedAt: Date.now(),
      durationMs: Date.now() - startedAt,
    };
  }

  async function executeParallel(tasks, correlationId) {
    if (!Array.isArray(tasks) || tasks.length === 0) throw new Error('SUPERGPU_TASKS_REQUIRED');
    const byId = new Map(tasks.map((task) => [task.id, task]));
    if (byId.size !== tasks.length) throw new Error('SUPERGPU_DUPLICATE_TASK_ID');
    tasks.forEach((task) => {
      resolve(task);
      dependenciesOf(task).forEach((dependency) => {
        if (!byId.has(dependency)) throw new Error(`SUPERGPU_MISSING_DEPENDENCY:${task.id}:${dependency}`);
      });
    });

    const completed = new Map();
    const failed = new Map();
    const pending = new Set(tasks.map((task) => task.id));

    while (pending.size) {
      const ready = [...pending]
        .map((id) => byId.get(id))
        .filter((task) => dependenciesOf(task).every((dependency) => completed.has(dependency)));

      if (!ready.length) {
        throw new Error('SUPERGPU_DEPENDENCY_CYCLE_OR_MISSING_DEPENDENCY');
      }

      const wave = await Promise.all(ready.map(async (task) => {
        try {
          const result = await execute(task, correlationId);
          return { task, result, error: null };
        } catch (error) {
          return { task, result: null, error };
        }
      }));

      for (const item of wave) {
        pending.delete(item.task.id);
        if (item.error) {
          const message = item.error instanceof Error ? item.error.message : String(item.error);
          failed.set(item.task.id, message);
        } else {
          completed.set(item.task.id, item.result);
        }
      }

      const newlyBlocked = [...pending].filter((id) => {
        const task = byId.get(id);
        return dependenciesOf(task).some((dependency) => failed.has(dependency));
      });
      for (const id of newlyBlocked) {
        const task = byId.get(id);
        const dependency = dependenciesOf(task).find((candidate) => failed.has(candidate));
        failed.set(id, `SUPERGPU_DEPENDENCY_FAILED:${dependency}`);
        pending.delete(id);
      }

      if (failed.size && pending.size && [...pending].every((id) => failed.has(id))) {
        break;
      }
    }

    return tasks.map((task) => {
      if (completed.has(task.id)) return completed.get(task.id);
      const reason = failed.get(task.id) || 'SUPERGPU_TASK_UNCOMPLETED';
      return {
        taskId: task.id,
        correlationId: correlationId || null,
        capability: task.capability,
        owner: resolve(task).owner,
        backend: resolve(task).backend,
        execution: 'rejected',
        ok: false,
        error: reason,
        startedAt: Date.now(),
        finishedAt: Date.now(),
        durationMs: 0,
      };
    });
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
      localExecutionRequiresHandler: true,
      timing: { perTaskDurationMs: true, dependencyAware: true },
    };
  }

  return { resolve, execute, executeParallel, describe };
}
