create extension if not exists pgcrypto;

-- Indexes that depend on tables introduced by the dynamic-content migration.
create index if not exists skill_category_sort_idx
  on public.skill (category, sort_order, created_at);
create index if not exists journey_item_start_date_idx
  on public.journey_item (start_date desc);
create index if not exists contact_social_active_sort_idx
  on public.contact_social (is_active, sort_order, id);

-- Project visibility is separate from presentation fields so synchronisation
-- can hide private/deleted repositories without changing card content.
alter table public.project
  add column if not exists visibility text not null default 'public';
alter table public.project drop constraint if exists project_visibility_check;
alter table public.project add constraint project_visibility_check
  check (visibility in ('public', 'private'));

alter table public.project drop constraint if exists project_sort_order_check;
alter table public.project add constraint project_sort_order_check check (sort_order >= 0) not valid;
alter table public.home_role drop constraint if exists home_role_sort_order_check;
alter table public.home_role add constraint home_role_sort_order_check check (sort_order >= 0) not valid;
alter table public.home_capability drop constraint if exists home_capability_sort_order_check;
alter table public.home_capability add constraint home_capability_sort_order_check check (sort_order >= 0) not valid;
alter table public.skill_category drop constraint if exists skill_category_sort_order_check;
alter table public.skill_category add constraint skill_category_sort_order_check check (sort_order >= 0) not valid;
alter table public.skill drop constraint if exists skill_sort_order_check;
alter table public.skill add constraint skill_sort_order_check check (sort_order >= 0) not valid;
alter table public.journey_item drop constraint if exists journey_item_sort_order_check;
alter table public.journey_item add constraint journey_item_sort_order_check check (sort_order >= 0) not valid;
alter table public.journey_item drop constraint if exists journey_item_dates_check;
alter table public.journey_item add constraint journey_item_dates_check
  check (end_date is null or end_date >= start_date) not valid;
alter table public.contact_social drop constraint if exists contact_social_href_scheme_check;
alter table public.contact_social add constraint contact_social_href_scheme_check
  check (href ~* '^(https://|mailto:)') not valid;
alter table public.skill drop constraint if exists skill_category_fkey;
alter table public.skill add constraint skill_category_fkey
  foreign key (category) references public.skill_category(name) not valid;

alter table public.project validate constraint project_sort_order_check;
alter table public.home_role validate constraint home_role_sort_order_check;
alter table public.home_capability validate constraint home_capability_sort_order_check;
alter table public.skill_category validate constraint skill_category_sort_order_check;
alter table public.skill validate constraint skill_sort_order_check;
alter table public.skill validate constraint skill_category_fkey;
alter table public.journey_item validate constraint journey_item_sort_order_check;
alter table public.journey_item validate constraint journey_item_dates_check;
alter table public.contact_social validate constraint contact_social_href_scheme_check;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'site_profile', 'home_role', 'home_capability', 'skill_category', 'skill',
    'journey_item', 'contact_social', 'site_cv', 'profile', 'project', 'rag_source'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name
    );
  end loop;
end;
$$;

-- Persistent, atomic abuse controls. Raw network addresses are never stored.
create table if not exists public.request_quota (
  action text not null,
  scope text not null check (scope in ('session', 'ip', 'global')),
  subject_hash text not null,
  bucket_start timestamptz not null,
  expires_at timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (action, scope, subject_hash, bucket_start)
);

create table if not exists public.request_lease (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  session_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists request_lease_action_expiry_idx
  on public.request_lease (action, expires_at);

create table if not exists public.job_lease (
  job_name text primary key,
  lease_token uuid not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contact_submission (
  id uuid primary key default gen_random_uuid(),
  session_hash text not null,
  ip_hash text not null,
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) between 3 and 254),
  message text not null check (char_length(message) between 1 and 1000),
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'failed')),
  expires_at timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists contact_submission_expiry_idx
  on public.contact_submission (expires_at, status);

create table if not exists public.contact_upload (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.contact_submission(id) on delete cascade,
  object_path text not null unique,
  original_name text not null,
  declared_mime text not null,
  declared_size bigint not null check (declared_size between 1 and 10485760),
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists contact_upload_submission_idx
  on public.contact_upload (submission_id);

drop trigger if exists set_updated_at on public.contact_submission;
create trigger set_updated_at before update on public.contact_submission
for each row execute function public.set_updated_at();

create or replace function public.acquire_request_budget(
  p_action text,
  p_ip_hash text,
  p_session_hash text,
  p_session_limit integer,
  p_session_window_seconds integer,
  p_ip_limit integer,
  p_ip_window_seconds integer,
  p_global_limit integer,
  p_global_window_seconds integer,
  p_concurrency_limit integer,
  p_lease_seconds integer,
  p_captcha_verified boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_time timestamptz := timezone('utc', now());
  session_start timestamptz;
  ip_start timestamptz;
  global_start timestamptz;
  session_count integer;
  ip_count integer;
  global_count integer;
  active_count integer;
  lease_id uuid;
begin
  if p_action !~ '^[a-z_]{2,40}$'
    or char_length(p_ip_hash) < 32
    or char_length(p_session_hash) < 32
    or least(
      p_session_limit, p_session_window_seconds, p_ip_limit, p_ip_window_seconds,
      p_global_limit, p_global_window_seconds, p_concurrency_limit, p_lease_seconds
    ) < 1 then
    raise exception 'invalid request budget arguments';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_action, 0));
  delete from public.request_lease where expires_at <= current_time;
  delete from public.request_quota where expires_at <= current_time;

  session_start := to_timestamp(floor(extract(epoch from current_time) / p_session_window_seconds) * p_session_window_seconds);
  ip_start := to_timestamp(floor(extract(epoch from current_time) / p_ip_window_seconds) * p_ip_window_seconds);
  global_start := to_timestamp(floor(extract(epoch from current_time) / p_global_window_seconds) * p_global_window_seconds);

  select coalesce(max(request_count), 0) into session_count from public.request_quota
    where action = p_action and scope = 'session' and subject_hash = p_session_hash and bucket_start = session_start;
  select coalesce(max(request_count), 0) into ip_count from public.request_quota
    where action = p_action and scope = 'ip' and subject_hash = p_ip_hash and bucket_start = ip_start;
  select coalesce(max(request_count), 0) into global_count from public.request_quota
    where action = p_action and scope = 'global' and subject_hash = 'global' and bucket_start = global_start;
  select count(*) into active_count from public.request_lease
    where action = p_action and expires_at > current_time;

  if global_count >= p_global_limit
    or session_count >= p_session_limit
    or ip_count >= p_ip_limit then
    return jsonb_build_object('allowed', false, 'reason', 'rate_limited');
  end if;
  if active_count >= p_concurrency_limit then
    return jsonb_build_object('allowed', false, 'reason', 'busy');
  end if;
  -- Challenge the final request below either hard ceiling. A successful
  -- challenge never bypasses the configured quota.
  if not p_captcha_verified and (
    session_count >= greatest(1, p_session_limit - 1)
    or ip_count >= greatest(1, p_ip_limit - 1)
  ) then
    return jsonb_build_object('allowed', false, 'reason', 'captcha_required');
  end if;

  insert into public.request_quota(action, scope, subject_hash, bucket_start, expires_at, request_count)
  values (p_action, 'session', p_session_hash, session_start, session_start + make_interval(secs => p_session_window_seconds), 1)
  on conflict (action, scope, subject_hash, bucket_start)
  do update set request_count = public.request_quota.request_count + 1;

  insert into public.request_quota(action, scope, subject_hash, bucket_start, expires_at, request_count)
  values (p_action, 'ip', p_ip_hash, ip_start, ip_start + make_interval(secs => p_ip_window_seconds), 1)
  on conflict (action, scope, subject_hash, bucket_start)
  do update set request_count = public.request_quota.request_count + 1;

  insert into public.request_quota(action, scope, subject_hash, bucket_start, expires_at, request_count)
  values (p_action, 'global', 'global', global_start, global_start + make_interval(secs => p_global_window_seconds), 1)
  on conflict (action, scope, subject_hash, bucket_start)
  do update set request_count = public.request_quota.request_count + 1;

  insert into public.request_lease(action, session_hash, expires_at)
  values (p_action, p_session_hash, current_time + make_interval(secs => p_lease_seconds))
  returning id into lease_id;

  return jsonb_build_object('allowed', true, 'lease_id', lease_id);
end;
$$;

create or replace function public.release_request_lease(p_lease_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$ delete from public.request_lease where id = p_lease_id $$;

create or replace function public.acquire_concurrency_lease(
  p_action text,
  p_session_hash text,
  p_concurrency_limit integer,
  p_lease_seconds integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare current_time timestamptz := timezone('utc', now());
declare lease_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_action, 0));
  delete from public.request_lease where expires_at <= current_time;
  if (select count(*) from public.request_lease where action = p_action and expires_at > current_time) >= p_concurrency_limit then
    return null;
  end if;
  insert into public.request_lease(action, session_hash, expires_at)
  values (p_action, p_session_hash, current_time + make_interval(secs => p_lease_seconds))
  returning id into lease_id;
  return lease_id;
end;
$$;

create or replace function public.acquire_job_lease(
  p_job_name text,
  p_lease_seconds integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare token uuid := gen_random_uuid();
begin
  insert into public.job_lease(job_name, lease_token, expires_at)
  values (p_job_name, token, timezone('utc', now()) + make_interval(secs => p_lease_seconds))
  on conflict (job_name) do update
    set lease_token = excluded.lease_token,
        expires_at = excluded.expires_at,
        updated_at = timezone('utc', now())
    where public.job_lease.expires_at <= timezone('utc', now());
  if not found then return null; end if;
  return token;
end;
$$;

create or replace function public.release_job_lease(p_job_name text, p_lease_token uuid)
returns void
language sql
security definer
set search_path = ''
as $$ delete from public.job_lease where job_name = p_job_name and lease_token = p_lease_token $$;

create or replace function public.sync_github_projects(
  p_rows jsonb,
  p_seen_full_names text[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare item jsonb;
declare changed integer := 0;
declare deactivated integer := 0;
declare normalized_full_name text;
declare item_source_kind text;
begin
  perform pg_advisory_xact_lock(hashtextextended('github_project_sync', 0));

  for item in select value from jsonb_array_elements(p_rows) loop
    normalized_full_name := nullif(lower(item->>'github_full_name'), '');
    item_source_kind := coalesce(item->>'source_kind', 'github');

    update public.project
      set github_full_name = case
            when item_source_kind = 'manual' then null
            else coalesce(normalized_full_name, github_full_name)
          end,
          github_url = case
            when item_source_kind = 'manual' then item->>'github_url'
            else github_url
          end,
          source_kind = case
            when item_source_kind = 'manual' then 'manual'
            else source_kind
          end,
          last_synced_at = timezone('utc', now()),
          is_active = true,
          visibility = 'public'
      where (normalized_full_name is not null and lower(github_full_name) = normalized_full_name)
         or lower(github_url) = lower(item->>'github_url')
         or (
           item_source_kind = 'manual'
           and (
             lower(coalesce(github_full_name, '')) = 'mouaz7/portfolio'
             or lower(github_url) = 'https://github.com/mouaz7/portfolio'
             or (source_kind = 'manual' and lower(title) = lower(item->>'title'))
           )
         );

    if found then
      changed := changed + 1;
      continue;
    end if;

    insert into public.project(
      title, description, category, github_url, languages, cover_image_href,
      is_active, sort_order, source_kind, github_full_name, sync_enabled,
      last_synced_at, visibility
    ) values (
      item->>'title', coalesce(item->>'description', ''), item->>'category',
      item->>'github_url',
      coalesce(array(select jsonb_array_elements_text(item->'languages')), '{}'::text[]),
      item->>'cover_image_href', true, coalesce((item->>'sort_order')::integer, 0),
      item_source_kind, normalized_full_name, true, timezone('utc', now()), 'public'
    );
    changed := changed + 1;
  end loop;

  update public.project
    set is_active = false,
        visibility = 'private',
        last_synced_at = timezone('utc', now())
    where source_kind = 'github'
      and sync_enabled
      and github_full_name is not null
      and not (lower(github_full_name) = any(coalesce(p_seen_full_names, '{}'::text[])));
  get diagnostics deactivated = row_count;
  changed := changed + deactivated;
  return changed;
end;
$$;

create or replace function public.claim_contact_submission(
  p_submission_id uuid,
  p_session_hash text
)
returns setof public.contact_submission
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
    update public.contact_submission
      set status = 'sending'
      where id = p_submission_id
        and session_hash = p_session_hash
        and status = 'pending'
        and expires_at > timezone('utc', now())
      returning *;
end;
$$;

-- Atomic replacement keeps the previous source intact until all embeddings are ready.
create or replace function public.replace_rag_source(
  p_source_table text,
  p_source_pk text,
  p_title text,
  p_language text,
  p_source_hash text,
  p_metadata jsonb,
  p_chunks jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare source_uuid uuid;
begin
  insert into public.rag_source(source_table, source_pk, title, language, source_hash, metadata, last_indexed_at)
  values (p_source_table, p_source_pk, p_title, p_language, p_source_hash, coalesce(p_metadata, '{}'::jsonb), timezone('utc', now()))
  on conflict (source_table, source_pk) do update
    set title = excluded.title,
        language = excluded.language,
        source_hash = excluded.source_hash,
        metadata = excluded.metadata,
        last_indexed_at = excluded.last_indexed_at
  returning id into source_uuid;

  delete from public.rag_chunk where source_id = source_uuid;
  insert into public.rag_chunk(source_id, chunk_index, content, language, embedding, token_estimate, metadata)
  select source_uuid, item.chunk_index, item.content, item.language,
         item.embedding::extensions.vector(2048), item.token_estimate, item.metadata
  from jsonb_to_recordset(p_chunks) as item(
    chunk_index integer,
    content text,
    language text,
    embedding text,
    token_estimate integer,
    metadata jsonb
  );
  return source_uuid;
end;
$$;

create or replace function public.match_rag_chunks(
  query_embedding extensions.vector(2048),
  match_count integer default 8,
  match_threshold double precision default 0,
  filter_language text default null
)
returns table (
  chunk_id uuid, source_id uuid, source_table text, source_pk text,
  title text, content text, language text, similarity double precision, metadata jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.id, s.id, s.source_table, s.source_pk, s.title, c.content, c.language,
    1 - ((c.embedding::extensions.halfvec(2048)) OPERATOR(extensions.<=>) (query_embedding::extensions.halfvec(2048))),
    jsonb_build_object('source', s.metadata, 'chunk', c.metadata, 'chunk_index', c.chunk_index)
  from public.rag_chunk c
  join public.rag_source s on s.id = c.source_id
  where (filter_language is null or filter_language = 'auto' or c.language = filter_language or c.language = 'und')
    and 1 - ((c.embedding::extensions.halfvec(2048)) OPERATOR(extensions.<=>) (query_embedding::extensions.halfvec(2048))) >= match_threshold
  order by (c.embedding::extensions.halfvec(2048)) OPERATOR(extensions.<=>) (query_embedding::extensions.halfvec(2048))
  limit least(greatest(coalesce(match_count, 8), 1), 20)
$$;

-- Public-content RLS. There is deliberately no authenticated write path.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'project', 'site_profile', 'home_role', 'home_capability', 'skill_category',
    'skill', 'journey_item', 'contact_social', 'site_cv', 'profile', 'rag_source',
    'rag_chunk', 'rag_index_run', 'request_quota', 'request_lease', 'job_lease',
    'contact_submission', 'contact_upload'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from public, anon, authenticated', table_name);
    execute format('grant all on public.%I to service_role', table_name);
  end loop;
end;
$$;

-- Remove permissive policies from earlier deployments before installing the
-- active/public-only policies below. Policies are ORed, so leaving these in
-- place would bypass the stricter predicates.
drop policy if exists "Public read project" on public.project;
drop policy if exists "Public read journey_item" on public.journey_item;
drop policy if exists "Public read skill" on public.skill;
drop policy if exists "Public read skill_category" on public.skill_category;
drop policy if exists "contact_social public read" on public.contact_social;
drop policy if exists "site_cv read" on public.site_cv;
drop index if exists public.skill_category_name_key;

drop policy if exists project_public_read on public.project;
create policy project_public_read on public.project for select to anon
  using (is_active and visibility = 'public');
drop policy if exists site_profile_public_read on public.site_profile;
create policy site_profile_public_read on public.site_profile for select to anon using (true);
drop policy if exists home_role_public_read on public.home_role;
create policy home_role_public_read on public.home_role for select to anon using (is_active);
drop policy if exists home_capability_public_read on public.home_capability;
create policy home_capability_public_read on public.home_capability for select to anon using (is_active);
drop policy if exists skill_category_public_read on public.skill_category;
create policy skill_category_public_read on public.skill_category for select to anon using (is_active);
drop policy if exists skill_public_read on public.skill;
create policy skill_public_read on public.skill for select to anon using (is_active);
drop policy if exists journey_item_public_read on public.journey_item;
create policy journey_item_public_read on public.journey_item for select to anon using (is_active);
drop policy if exists contact_social_public_read on public.contact_social;
create policy contact_social_public_read on public.contact_social for select to anon using (is_active);

grant select on public.project, public.site_profile, public.home_role, public.home_capability,
  public.skill_category, public.skill, public.journey_item, public.contact_social to anon;
grant usage, select on all sequences in schema public to service_role;

revoke all on function public.acquire_request_budget(text,text,text,integer,integer,integer,integer,integer,integer,integer,integer,boolean) from public, anon, authenticated;
revoke all on function public.release_request_lease(uuid) from public, anon, authenticated;
revoke all on function public.acquire_concurrency_lease(text,text,integer,integer) from public, anon, authenticated;
revoke all on function public.acquire_job_lease(text,integer) from public, anon, authenticated;
revoke all on function public.release_job_lease(text,uuid) from public, anon, authenticated;
revoke all on function public.sync_github_projects(jsonb,text[]) from public, anon, authenticated;
revoke all on function public.claim_contact_submission(uuid,text) from public, anon, authenticated;
revoke all on function public.replace_rag_source(text,text,text,text,text,jsonb,jsonb) from public, anon, authenticated;
revoke all on function public.match_rag_chunks(extensions.vector,integer,double precision,text) from public, anon, authenticated;
grant execute on function public.acquire_request_budget(text,text,text,integer,integer,integer,integer,integer,integer,integer,integer,boolean) to service_role;
grant execute on function public.release_request_lease(uuid) to service_role;
grant execute on function public.acquire_concurrency_lease(text,text,integer,integer) to service_role;
grant execute on function public.acquire_job_lease(text,integer) to service_role;
grant execute on function public.release_job_lease(text,uuid) to service_role;
grant execute on function public.sync_github_projects(jsonb,text[]) to service_role;
grant execute on function public.claim_contact_submission(uuid,text) to service_role;
grant execute on function public.replace_rag_source(text,text,text,text,text,jsonb,jsonb) to service_role;
grant execute on function public.match_rag_chunks(extensions.vector,integer,double precision,text) to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'contact-uploads', 'contact-uploads', false, 10485760,
  array[
    'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
