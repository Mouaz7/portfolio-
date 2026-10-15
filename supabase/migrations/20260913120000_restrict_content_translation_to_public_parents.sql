-- A translation is public only while its parent row is public. Keep this as a
-- forward migration so deployed history remains immutable.
drop policy if exists content_translation_public_read on public.content_translation;

create policy content_translation_public_read
  on public.content_translation
  for select
  to anon
  using (
    case entity_type
      when 'site_profile' then exists (
        select 1
        from public.site_profile as parent
        where parent.id::text = content_translation.entity_id
      )
      when 'home_role' then exists (
        select 1
        from public.home_role as parent
        where parent.id::text = content_translation.entity_id
          and parent.is_active
      )
      when 'home_capability' then exists (
        select 1
        from public.home_capability as parent
        where parent.id = content_translation.entity_id
          and parent.is_active
      )
      when 'skill_category' then exists (
        select 1
        from public.skill_category as parent
        where parent.name = content_translation.entity_id
          and parent.is_active
      )
      when 'project' then exists (
        select 1
        from public.project as parent
        where parent.id::text = content_translation.entity_id
          and parent.is_active
          and parent.visibility = 'public'
      )
      when 'journey_item' then exists (
        select 1
        from public.journey_item as parent
        where parent.id::text = content_translation.entity_id
          and parent.is_active
      )
      else false
    end
  );

comment on policy content_translation_public_read on public.content_translation is
  'Anonymous readers can see translations only when the corresponding parent is publicly readable.';
