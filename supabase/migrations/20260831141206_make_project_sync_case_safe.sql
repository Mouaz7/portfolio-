-- GitHub repository names and web URLs are case-insensitive. Older discovery runs
-- could therefore leave two project rows whose URLs differed only by casing.
-- Consolidate those rows once, enforce the normalized identity, and make the
-- atomic sync update exactly one deterministic project row.

begin;

create temporary table project_case_duplicate_map on commit drop as
with ranked as (
  select
    id,
    first_value(id) over (
      partition by lower(rtrim(github_url, '/'))
      order by
        (source_kind = 'manual') desc,
        is_active desc,
        sync_enabled desc,
        sort_order asc,
        created_at asc,
        id asc
    ) as keeper_id,
    row_number() over (
      partition by lower(rtrim(github_url, '/'))
      order by
        (source_kind = 'manual') desc,
        is_active desc,
        sync_enabled desc,
        sort_order asc,
        created_at asc,
        id asc
    ) as duplicate_rank
  from public.project
  where source_kind = 'github'
)
select id as duplicate_id, keeper_id
from ranked
where duplicate_rank > 1;

do $$
declare duplicate record;
begin
  for duplicate in select duplicate_id, keeper_id from project_case_duplicate_map loop
    insert into public.content_translation(entity_type, entity_id, locale, fields, updated_at)
    select
      'project',
      duplicate.keeper_id::text,
      translation.locale,
      translation.fields,
      translation.updated_at
    from public.content_translation as translation
    where translation.entity_type = 'project'
      and translation.entity_id = duplicate.duplicate_id::text
    on conflict (entity_type, entity_id, locale) do update
      set fields = excluded.fields || public.content_translation.fields,
          updated_at = greatest(public.content_translation.updated_at, excluded.updated_at);

    delete from public.content_translation
    where entity_type = 'project'
      and entity_id = duplicate.duplicate_id::text;

    -- A subsequent controlled RAG refresh recreates the retained project
    -- source. Removing only the discarded source prevents orphaned chunks.
    delete from public.rag_source
    where source_table = 'project'
      and source_pk = duplicate.duplicate_id::text;

    delete from public.project where id = duplicate.duplicate_id;
  end loop;
end;
$$;

update public.project
set github_full_name = lower(github_full_name)
where github_full_name is not null
  and github_full_name <> lower(github_full_name);

drop index if exists public.project_github_full_name_key;
create unique index if not exists project_github_full_name_key
  on public.project (lower(github_full_name))
  where github_full_name is not null;

create unique index if not exists project_github_url_normalized_key
  on public.project (lower(rtrim(github_url, '/')))
  where source_kind = 'github';

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
declare normalized_github_url text;
declare item_source_kind text;
declare target_project_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('github_project_sync', 0));

  for item in select value from jsonb_array_elements(p_rows) loop
    normalized_full_name := nullif(lower(item->>'github_full_name'), '');
    normalized_github_url := lower(rtrim(item->>'github_url', '/'));
    item_source_kind := coalesce(item->>'source_kind', 'github');
    target_project_id := null;

    select project.id
    into target_project_id
    from public.project as project
    where (normalized_full_name is not null and lower(project.github_full_name) = normalized_full_name)
       or lower(rtrim(project.github_url, '/')) = normalized_github_url
       or (
         item_source_kind = 'manual'
         and (
           lower(coalesce(project.github_full_name, '')) = 'mouaz7/portfolio'
           or lower(rtrim(project.github_url, '/')) = 'https://github.com/mouaz7/portfolio'
           or (project.source_kind = 'manual' and lower(project.title) = lower(item->>'title'))
         )
       )
    order by
      case
        when normalized_full_name is not null
          and lower(project.github_full_name) = normalized_full_name then 0
        when lower(rtrim(project.github_url, '/')) = normalized_github_url then 1
        else 2
      end,
      project.is_active desc,
      project.created_at asc,
      project.id asc
    limit 1
    for update;

    if target_project_id is not null then
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
      where id = target_project_id;

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

revoke all on function public.sync_github_projects(jsonb,text[]) from public, anon, authenticated;
grant execute on function public.sync_github_projects(jsonb,text[]) to service_role;

commit;
