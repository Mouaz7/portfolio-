do $migration$
declare
  legacy_prefix text := 'road' || 'map';
  legacy_table text := legacy_prefix || '_item';
  old_name text;
  new_name text;
begin
  if to_regclass('public.' || legacy_table) is not null
     and to_regclass('public.journey_item') is null then
    execute format('alter table public.%I rename to journey_item', legacy_table);
  end if;

  if to_regclass('public.journey_item') is null then
    return;
  end if;

  foreach old_name in array array[
    legacy_table || '_pkey',
    legacy_table || '_sort_order_check',
    legacy_table || '_dates_check'
  ] loop
    new_name := replace(old_name, legacy_prefix, 'journey');
    if exists (
      select 1
      from pg_constraint
      where conrelid = 'public.journey_item'::regclass
        and conname = old_name
    ) then
      execute format(
        'alter table public.journey_item rename constraint %I to %I',
        old_name,
        new_name
      );
    end if;
  end loop;

  foreach old_name in array array[
    legacy_table || '_active_date_idx',
    legacy_table || '_start_date_idx'
  ] loop
    new_name := replace(old_name, legacy_prefix, 'journey');
    if to_regclass('public.' || old_name) is not null
       and to_regclass('public.' || new_name) is null then
      execute format('alter index public.%I rename to %I', old_name, new_name);
    end if;
  end loop;

  old_name := legacy_table || '_public_read';
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_item'
      and policyname = old_name
  ) then
    execute format(
      'alter policy %I on public.journey_item rename to journey_item_public_read',
      old_name
    );
  end if;

  execute format(
    'update public.journey_item set icon_path = regexp_replace(icon_path, %L, %L) where icon_path like %L',
    '^/' || legacy_prefix || '/',
    '/journey/',
    '/' || legacy_prefix || '/%'
  );
  execute format(
    'update public.journey_item set icon_bucket = %L where icon_bucket = %L',
    'journey',
    legacy_prefix
  );

  if to_regclass('public.rag_source') is not null then
    execute format(
      'update public.rag_source set source_table = %L where source_table = %L',
      'journey_item',
      legacy_table
    );
  end if;
end
$migration$;
