-- Keep the public portfolio card linked to the clean replacement repository.
-- The project id remains unchanged, so existing localized content continues
-- to reference the same project row.

begin;

update public.project
set github_url = 'https://github.com/Mouaz7/portfolio-',
    updated_at = timezone('utc', now())
where lower(rtrim(github_url, '/')) = 'https://github.com/mouaz7/portfolio'
  and not exists (
    select 1
    from public.project as replacement
    where lower(rtrim(replacement.github_url, '/')) = 'https://github.com/mouaz7/portfolio-'
  );

commit;
