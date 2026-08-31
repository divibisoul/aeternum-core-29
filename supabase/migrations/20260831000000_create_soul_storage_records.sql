create table if not exists public.soul_storage_records (
  id uuid primary key default gen_random_uuid(),
  nucleus_id text not null,
  cid text not null unique,
  mime_type text not null default 'application/octet-stream',
  gateway_url text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.soul_storage_records enable row level security;

revoke all on table public.soul_storage_records from anon, authenticated;
grant select, insert on table public.soul_storage_records to service_role;

create index if not exists soul_storage_records_nucleus_idx
  on public.soul_storage_records (nucleus_id);

create index if not exists soul_storage_records_created_at_idx
  on public.soul_storage_records (created_at desc);

create index if not exists soul_storage_records_metadata_idx
  on public.soul_storage_records using gin (metadata);
