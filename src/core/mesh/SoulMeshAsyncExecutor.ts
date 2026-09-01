import type { SoulMeshTelemetry } from '../../../lib/soul-mesh/SoulMeshTelemetry';
import type { SoulMeshJob, SoulMeshJobStore } from './SoulMeshAsyncJobStore';

export interface SoulMeshAsyncExecutionContext {
  execute(job: SoulMeshJob): Promise<unknown>;
}

/** Pull-based worker: safe for serverless because one invocation claims one job. */
export class SoulMeshAsyncExecutor {
  constructor(
    private readonly store: SoulMeshJobStore,
    private readonly context: SoulMeshAsyncExecutionContext,
    private readonly telemetry?: SoulMeshTelemetry,
  ) {}

  async run(jobId: string): Promise<SoulMeshJob | null> {
    const startedAt = Date.now();
    const job = await this.store.claim(jobId);
    if (!job) return this.store.get(jobId);

    this.telemetry?.emit('mesh.job.queued', {
      jobId: job.jobId,
      correlationId: job.correlationId,
      target: job.target,
      capability: job.capability,
      status: job.status,
    });
    this.telemetry?.emit('mesh.capability.started', {
      jobId: job.jobId,
      correlationId: job.correlationId,
      target: job.target,
      capability: job.capability,
      status: job.status,
    });

    try {
      const result = await this.context.execute(job);
      const completed = await this.store.complete(job.jobId, result);
      this.telemetry?.emit('mesh.capability.completed', {
        jobId: job.jobId,
        correlationId: job.correlationId,
        target: job.target,
        capability: job.capability,
        status: completed.status,
        durationMs: Date.now() - startedAt,
      });
      this.telemetry?.emit('mesh.job.completed', {
        jobId: job.jobId,
        correlationId: job.correlationId,
        target: job.target,
        capability: job.capability,
        status: completed.status,
        durationMs: Date.now() - startedAt,
      });
      return completed;
    } catch (error) {
      const failed = await this.store.fail(job.jobId, {
        code: 'ASYNC_EXECUTION_FAILED',
        detail: error instanceof Error ? error.message : String(error),
      });
      this.telemetry?.emit('mesh.capability.failed', {
        jobId: job.jobId,
        correlationId: job.correlationId,
        target: job.target,
        capability: job.capability,
        status: failed.status,
        durationMs: Date.now() - startedAt,
        errorCode: 'ASYNC_EXECUTION_FAILED',
      });
      this.telemetry?.emit('mesh.job.failed', {
        jobId: job.jobId,
        correlationId: job.correlationId,
        target: job.target,
        capability: job.capability,
        status: failed.status,
        durationMs: Date.now() - startedAt,
        errorCode: 'ASYNC_EXECUTION_FAILED',
      });
      return failed;
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
