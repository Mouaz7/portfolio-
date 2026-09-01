-- Earlier public-read policies were more permissive than the hardened
-- active/public-only policies. PostgreSQL combines permissive policies with
-- OR, so remove the legacy policies rather than leaving both sets active.
drop policy if exists "Public read project" on public.project;
drop policy if exists "Public read journey_item" on public.journey_item;
drop policy if exists "Public read skill" on public.skill;
drop policy if exists "Public read skill_category" on public.skill_category;
drop policy if exists "contact_social public read" on public.contact_social;
drop policy if exists "site_cv read" on public.site_cv;

-- The primary key on skill_category(name) already provides this unique index.
drop index if exists public.skill_category_name_key;
