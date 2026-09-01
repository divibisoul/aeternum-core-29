import type { SoulNucleus } from './SoulMeshProtocol';

export type SuperComputeTask<T = unknown> = {
  id: string;
  capability: string;
  target: SoulNucleus;
  input: T;
  dependsOn?: readonly string[];
  priority?: number;
};

export type SuperComputeResult = {
  taskId: string;
  target: SoulNucleus;
  capability: string;
  ok: boolean;
  output?: unknown;
  error?: string;
  durationMs: number;
};

export type SuperComputeExecutionContext = {
  execute(task: SuperComputeTask): Promise<unknown>;
  validate?(task: SuperComputeTask, output: unknown): Promise<boolean> | boolean;
};

export type SuperComputePlan = {
  id: string;
  tasks: readonly SuperComputeTask[];
};

const ready = (task: SuperComputeTask, completed: ReadonlySet<string>) =>
  (task.dependsOn ?? []).every((dependency) => completed.has(dependency));

export function createSuperComputePlan(tasks: readonly SuperComputeTask[], id = crypto.randomUUID()): SuperComputePlan {
  const seen = new Set<string>();
  for (const task of tasks) {
    if (!task.id.trim()) throw new Error('SUPERCOMPUTE_TASK_ID_REQUIRED');
    if (seen.has(task.id)) throw new Error(`SUPERCOMPUTE_DUPLICATE_TASK:${task.id}`);
    seen.add(task.id);
    if (!task.capability.trim()) throw new Error(`SUPERCOMPUTE_CAPABILITY_REQUIRED:${task.id}`);
  }
  return { id, tasks: [...tasks] };
}

export async function executeSuperComputePlan(
  plan: SuperComputePlan,
  context: SuperComputeExecutionContext,
): Promise<SuperComputeResult[]> {
  const pending = new Map(plan.tasks.map((task) => [task.id, task]));
  const completed = new Set<string>();
  const results: SuperComputeResult[] = [];

  while (pending.size > 0) {
    const wave = [...pending.values()]
      .filter((task) => ready(task, completed))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    if (wave.length === 0) throw new Error('SUPERCOMPUTE_DEPENDENCY_DEADLOCK');

    const waveResults = await Promise.all(wave.map(async (task): Promise<SuperComputeResult> => {
      const startedAt = Date.now();
      try {
        const output = await context.execute(task);
        if (context.validate && !(await context.validate(task, output))) {
          throw new Error('SUPERCOMPUTE_RESULT_VALIDATION_FAILED');
        }
        return { taskId: task.id, target: task.target, capability: task.capability, ok: true, output, durationMs: Date.now() - startedAt };
      } catch (error) {
        return {
          taskId: task.id,
          target: task.target,
          capability: task.capability,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - startedAt,
        };
      }
    }));

    for (const task of wave) pending.delete(task.id);
    for (const result of waveResults) {
      results.push(result);
      if (result.ok) completed.add(result.taskId);
    }

    const failedRequired = waveResults.find((result) => !result.ok && [...pending.values()].some((task) => (task.dependsOn ?? []).includes(result.taskId)));
    if (failedRequired) throw new Error(`SUPERCOMPUTE_UPSTREAM_FAILED:${failedRequired.taskId}`);
  }

  return results;
}

export function summarizeSuperCompute(results: readonly SuperComputeResult[]) {
  const completed = results.filter((result) => result.ok).length;
  const failed = results.length - completed;
  const totalDurationMs = results.reduce((sum, result) => sum + result.durationMs, 0);
  return {
    total: results.length,
    completed,
    failed,
    successRate: results.length === 0 ? 0 : completed / results.length,
    totalDurationMs,
    maxTaskDurationMs: results.reduce((max, result) => Math.max(max, result.durationMs), 0),
  };
}
