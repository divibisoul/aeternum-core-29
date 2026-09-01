import type { SoulMeshJob, SoulMeshJobStore } from './SoulMeshAsyncJobStore';

export interface SoulMeshAsyncExecutionContext {
  execute(job: SoulMeshJob): Promise<unknown>;
}

/** Pull-based worker: safe for serverless because one invocation claims one job. */
export class SoulMeshAsyncExecutor {
  constructor(private readonly store: SoulMeshJobStore, private readonly context: SoulMeshAsyncExecutionContext) {}

  async run(jobId: string): Promise<SoulMeshJob | null> {
    const job = await this.store.claim(jobId);
    if (!job) return this.store.get(jobId);
    try {
      const result = await this.context.execute(job);
      return this.store.complete(job.jobId, result);
    } catch (error) {
      return this.store.fail(job.jobId, {
        code: 'ASYNC_EXECUTION_FAILED',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export function asyncAcceptedResponse(job: SoulMeshJob) {
  return {
    status: 202,
    body: {
      protocol: 'soul-mesh/1',
      contractVersion: '1.1.0',
      job_id: job.jobId,
      correlationId: job.correlationId,
      status: job.status,
      target: job.target,
      capability: job.capability,
      createdAt: job.createdAt,
    },
  } as const;
}
