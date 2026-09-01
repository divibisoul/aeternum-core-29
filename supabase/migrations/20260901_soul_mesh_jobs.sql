create table if not exists public.soul_mesh_jobs (
  job_id uuid primary key,
  correlation_id text not null,
  source text not null,
  target text not null,
  capability text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null check (status in ('queued','processing','completed','failed','expired')),
  result jsonb,
  error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists soul_mesh_jobs_correlation_idx on public.soul_mesh_jobs (correlation_id);
create index if not exists soul_mesh_jobs_status_idx on public.soul_mesh_jobs (status, updated_at);
create index if not exists soul_mesh_jobs_expiry_idx on public.soul_mesh_jobs (expires_at);

create or replace function public.soul_mesh_claim_job(p_job_id uuid)
returns setof public.soul_mesh_jobs
language sql
security definer
as $$
  update public.soul_mesh_jobs
     set status = 'processing', updated_at = now()
   where job_id = p_job_id
     and status = 'queued'
     and expires_at > now()
  returning *;
$$;

create or replace function public.soul_mesh_expire_jobs()
returns integer
language sql
security definer
as $$
  with expired as (
    update public.soul_mesh_jobs
       set status = 'expired', updated_at = now(), error = jsonb_build_object('code','JOB_EXPIRED')
     where status in ('queued','processing') and expires_at <= now()
     returning 1
  ) select count(*)::integer from expired;
$$;
