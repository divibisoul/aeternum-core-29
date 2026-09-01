export type SoulMeshJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'expired';

export interface SoulMeshJob<TPayload = unknown, TResult = unknown> {
  jobId: string;
  correlationId: string;
  source: string;
  target: string;
  capability: string;
  payload: TPayload;
  status: SoulMeshJobStatus;
  result?: TResult;
  error?: { code: string; detail?: string };
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export interface SoulMeshJobStore {
  create<TPayload>(input: Omit<SoulMeshJob<TPayload>, 'jobId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<SoulMeshJob<TPayload>>;
  get<TResult = unknown>(jobId: string): Promise<SoulMeshJob<unknown, TResult> | null>;
  claim(jobId: string): Promise<SoulMeshJob | null>;
  complete<TResult>(jobId: string, result: TResult): Promise<SoulMeshJob<unknown, TResult> | null>;
  fail(jobId: string, error: { code: string; detail?: string }): Promise<SoulMeshJob | null>;
}

/**
 * Adapter boundary for durable storage. Implementations must be external-store backed
 * in serverless production; no process-local polling loop is required or created here.
 */
export interface SoulMeshJobRepository {
  insert(job: SoulMeshJob): Promise<void>;
  find(jobId: string): Promise<SoulMeshJob | null>;
  claim(jobId: string, now: number): Promise<SoulMeshJob | null>;
  update(jobId: string, patch: Partial<Pick<SoulMeshJob, 'status' | 'result' | 'error' | 'updatedAt'>>): Promise<SoulMeshJob | null>;
}

export class RepositorySoulMeshJobStore implements SoulMeshJobStore {
  private readonly repository: SoulMeshJobRepository;
  private readonly ttlMs: number;

  constructor(repository: SoulMeshJobRepository, ttlMs = 10 * 60_000) {
    this.repository = repository;
    this.ttlMs = ttlMs;
    if (!Number.isFinite(ttlMs) || ttlMs < 1_000) throw new Error('INVALID_JOB_TTL');
  }

  async create<TPayload>(input: Omit<SoulMeshJob<TPayload>, 'jobId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<SoulMeshJob<TPayload>> {
    const now = Date.now();
    const expiresAt = Number.isFinite(input.expiresAt) ? input.expiresAt : now + this.ttlMs;
    if (expiresAt <= now) throw new Error('JOB_EXPIRY_MUST_BE_IN_FUTURE');
    const job: SoulMeshJob<TPayload> = { ...input, jobId: crypto.randomUUID(), status: 'queued', createdAt: now, updatedAt: now, expiresAt };
    await this.repository.insert(job);
    return job;
  }

  get<T = unknown>(jobId: string): Promise<SoulMeshJob<unknown, T> | null> {
    return this.repository.find(jobId) as Promise<SoulMeshJob<unknown, T> | null>;
  }

  claim(jobId: string): Promise<SoulMeshJob | null> {
    return this.repository.claim(jobId, Date.now());
  }

  complete<TResult>(jobId: string, result: TResult): Promise<SoulMeshJob<unknown, TResult> | null> {
    return this.repository.update(jobId, { status: 'completed', result, updatedAt: Date.now() }) as Promise<SoulMeshJob<unknown, TResult> | null>;
  }

  fail(jobId: string, error: { code: string; detail?: string }): Promise<SoulMeshJob | null> {
    return this.repository.update(jobId, { status: 'failed', error, updatedAt: Date.now() });
  }
}

export class InMemorySoulMeshJobRepository implements SoulMeshJobRepository {
  private readonly jobs = new Map<string, SoulMeshJob>();

  async insert(job: SoulMeshJob): Promise<void> { this.jobs.set(job.jobId, structuredClone(job)); }

  async find(jobId: string): Promise<SoulMeshJob | null> {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    if (job.expiresAt <= Date.now() && (job.status === 'queued' || job.status === 'processing')) {
      job.status = 'expired';
      job.updatedAt = Date.now();
      job.error = { code: 'JOB_EXPIRED' };
    }
    return structuredClone(job);
  }

  async claim(jobId: string, now: number): Promise<SoulMeshJob | null> {
    const job = this.jobs.get(jobId);
    if (!job || job.expiresAt <= now || job.status !== 'queued') return null;
    job.status = 'processing';
    job.updatedAt = now;
    return structuredClone(job);
  }

  async update(jobId: string, patch: Partial<Pick<SoulMeshJob, 'status' | 'result' | 'error' | 'updatedAt'>>): Promise<SoulMeshJob | null> {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    Object.assign(job, patch, { updatedAt: patch.updatedAt ?? Date.now() });
    return structuredClone(job);
  }
}

export function asyncPollingEnabled(): boolean {
  return typeof process !== 'undefined' && process.env.SOUL_MESH_ASYNC_ENABLED === 'true';
}
