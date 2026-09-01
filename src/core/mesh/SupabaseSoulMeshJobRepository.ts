import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SoulMeshJob, SoulMeshJobRepository } from './SoulMeshAsyncJobStore';

function env(name: string): string {
  return typeof process !== 'undefined' ? (process.env[name]?.trim() ?? '') : '';
}

export class SupabaseSoulMeshJobRepository implements SoulMeshJobRepository {
  private readonly client: SupabaseClient;

  constructor(options: { url?: string; key?: string } = {}) {
    const url = options.url?.trim() || env('SUPABASE_URL');
    const key = options.key?.trim() || env('SUPABASE_SERVICE_ROLE_KEY') || env('SUPABASE_SECRET_KEY');
    if (!url || !key) throw new Error('SUPABASE_MESH_JOB_STORAGE_NOT_CONFIGURED');
    this.client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  }

  async insert(job: SoulMeshJob): Promise<void> {
    const { error } = await this.client.from('soul_mesh_jobs').insert({
      job_id: job.jobId, correlation_id: job.correlationId, source: job.source, target: job.target,
      capability: job.capability, payload: job.payload, status: job.status, result: job.result ?? null,
      error: job.error ?? null, created_at: new Date(job.createdAt).toISOString(),
      updated_at: new Date(job.updatedAt).toISOString(), expires_at: new Date(job.expiresAt).toISOString(),
    });
    if (error) throw new Error(`SOUL_MESH_JOB_INSERT_FAILED:${error.message}`);
  }

  async find(jobId: string): Promise<SoulMeshJob | null> {
    const { data, error } = await this.client.from('soul_mesh_jobs').select('*').eq('job_id', jobId).maybeSingle();
    if (error) throw new Error(`SOUL_MESH_JOB_READ_FAILED:${error.message}`);
    return data ? this.fromRow(data) : null;
  }

  async claim(jobId: string, now: number): Promise<SoulMeshJob | null> {
    const { data, error } = await this.client.rpc('soul_mesh_claim_job', { p_job_id: jobId });
    if (error) throw new Error(`SOUL_MESH_JOB_CLAIM_FAILED:${error.message}`);
    return Array.isArray(data) && data[0] ? this.fromRow(data[0]) : null;
  }

  async update(jobId: string, patch: Partial<Pick<SoulMeshJob, 'status' | 'result' | 'error' | 'updatedAt'>>): Promise<SoulMeshJob | null> {
    const update: Record<string, unknown> = { updated_at: new Date(patch.updatedAt ?? Date.now()).toISOString() };
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.result !== undefined) update.result = patch.result;
    if (patch.error !== undefined) update.error = patch.error;
    const { data, error } = await this.client.from('soul_mesh_jobs').update(update).eq('job_id', jobId).select('*').maybeSingle();
    if (error) throw new Error(`SOUL_MESH_JOB_UPDATE_FAILED:${error.message}`);
    return data ? this.fromRow(data) : null;
  }

  private fromRow(row: any): SoulMeshJob {
    return {
      jobId: String(row.job_id), correlationId: String(row.correlation_id), source: String(row.source), target: String(row.target),
      capability: String(row.capability), payload: row.payload, status: row.status, result: row.result ?? undefined,
      error: row.error ?? undefined, createdAt: Date.parse(row.created_at), updatedAt: Date.parse(row.updated_at), expiresAt: Date.parse(row.expires_at),
    };
  }
}
