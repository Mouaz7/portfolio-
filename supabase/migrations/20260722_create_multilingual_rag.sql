create schema if not exists extensions;
create extension if not exists pgcrypto;
create extension if not exists vector with schema extensions;

set search_path = public, extensions;

create table if not exists public.rag_source (
  id uuid primary key default gen_random_uuid(),
  source_table text not null,
  source_pk text not null,
  title text not null,
  language text not null default 'und'
    check (language in ('sv', 'en', 'ar', 'und')),
  source_hash text not null,
  metadata jsonb not null default '{}'::jsonb,
  last_indexed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (source_table, source_pk)
);

create table if not exists public.rag_chunk (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.rag_source(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  language text not null default 'und'
    check (language in ('sv', 'en', 'ar', 'und')),
  embedding extensions.vector(2048) not null,
  token_estimate integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (source_id, chunk_index)
);

create table if not exists public.rag_index_run (
  id uuid primary key default gen_random_uuid(),
  status text not null
    check (status in ('running', 'success', 'error')),
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  duration_ms integer,
  sources_seen integer not null default 0,
  sources_indexed integer not null default 0,
  chunks_indexed integer not null default 0,
  error_summary text
);

create index if not exists rag_source_table_pk_idx
  on public.rag_source (source_table, source_pk);

create index if not exists rag_source_hash_idx
  on public.rag_source (source_hash);

create index if not exists rag_source_indexed_idx
  on public.rag_source (last_indexed_at desc);

create index if not exists rag_chunk_language_source_idx
  on public.rag_chunk (language, source_id);

create index if not exists rag_chunk_source_index_idx
  on public.rag_chunk (source_id, chunk_index);

create index if not exists rag_chunk_embedding_hnsw_idx
  on public.rag_chunk
  using hnsw ((embedding::halfvec(2048)) halfvec_cosine_ops);

create index if not exists project_is_active_sort_order_idx
  on public.project (is_active, sort_order, created_at desc);

create or replace function public.match_rag_chunks(
  query_embedding extensions.vector(2048),
  match_count integer default 8,
  match_threshold double precision default 0,
  filter_language text default null
)
returns table (
  chunk_id uuid,
  source_id uuid,
  source_table text,
  source_pk text,
  title text,
  content text,
  language text,
  similarity double precision,
  metadata jsonb
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    c.id as chunk_id,
    s.id as source_id,
    s.source_table,
    s.source_pk,
    s.title,
    c.content,
    c.language,
    1 - ((c.embedding::halfvec(2048)) <=> (query_embedding::halfvec(2048))) as similarity,
    jsonb_build_object(
      'source', s.metadata,
      'chunk', c.metadata,
      'chunk_index', c.chunk_index
    ) as metadata
  from public.rag_chunk c
  join public.rag_source s on s.id = c.source_id
  where
    (filter_language is null or filter_language = 'auto' or c.language = filter_language or c.language = 'und')
    and 1 - ((c.embedding::halfvec(2048)) <=> (query_embedding::halfvec(2048))) >= match_threshold
  order by (c.embedding::halfvec(2048)) <=> (query_embedding::halfvec(2048))
  limit least(greatest(coalesce(match_count, 8), 1), 20);
$$;

alter table public.rag_source enable row level security;
alter table public.rag_chunk enable row level security;
alter table public.rag_index_run enable row level security;

revoke all on public.rag_source from public, anon, authenticated;
revoke all on public.rag_chunk from public, anon, authenticated;
revoke all on public.rag_index_run from public, anon, authenticated;
revoke all on function public.match_rag_chunks(extensions.vector(2048), integer, double precision, text)
  from public, anon, authenticated;

grant execute on function public.match_rag_chunks(extensions.vector(2048), integer, double precision, text)
  to service_role;
