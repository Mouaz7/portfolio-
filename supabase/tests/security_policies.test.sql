begin;
select plan(32);

select ok((select relrowsecurity from pg_class where oid = 'public.project'::regclass), 'project has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.site_cv'::regclass), 'site_cv has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.rag_chunk'::regclass), 'rag_chunk has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.contact_submission'::regclass), 'contact submissions have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.content_translation'::regclass), 'content translations have RLS');

select ok(has_table_privilege('anon', 'public.project', 'select'), 'anon can select public projects');
select ok(has_table_privilege('anon', 'public.skill', 'select'), 'anon can select active skills');
select ok(has_table_privilege('anon', 'public.journey_item', 'select'), 'anon can select active journey rows');
select ok(has_table_privilege('anon', 'public.contact_social', 'select'), 'anon can select approved social links');
select ok(has_table_privilege('anon', 'public.content_translation', 'select'), 'anon can select localized public content');
select ok(not has_table_privilege('anon', 'public.project', 'insert'), 'anon cannot insert projects');
select ok(not has_table_privilege('anon', 'public.content_translation', 'insert'), 'anon cannot insert translations');
select ok(not has_table_privilege('anon', 'public.site_cv', 'select'), 'anon cannot read CV source text');
select ok(not has_table_privilege('anon', 'public.rag_chunk', 'select'), 'anon cannot read RAG chunks');
select ok(not has_table_privilege('anon', 'public.contact_submission', 'select'), 'anon cannot read contact submissions');

select ok(not has_table_privilege('authenticated', 'public.project', 'select'), 'authenticated receives no extra project access');
select ok(not has_table_privilege('authenticated', 'public.contact_submission', 'insert'), 'authenticated cannot insert contact submissions');
select ok(has_table_privilege('service_role', 'public.request_quota', 'insert'), 'service role can manage quotas');
select ok(has_table_privilege('service_role', 'public.contact_submission', 'select'), 'service role can read contact submissions');

select ok(not has_function_privilege('anon', 'public.match_rag_chunks(extensions.vector,integer,double precision,text)', 'execute'), 'anon cannot execute RAG search');
select ok(has_function_privilege('service_role', 'public.match_rag_chunks(extensions.vector,integer,double precision,text)', 'execute'), 'service role can execute RAG search');
select ok(not has_function_privilege('anon', 'public.acquire_request_budget(text,text,text,integer,integer,integer,integer,integer,integer,integer,integer,boolean)', 'execute'), 'anon cannot consume internal quotas directly');
select is((select public from storage.buckets where id = 'contact-uploads'), false, 'contact upload bucket is private');
select is(
  (select allowed_mime_types from storage.buckets where id = 'contact-uploads'),
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain']::text[],
  'contact bucket rejects office documents and accepts the five safe MIME families'
);
select is((select public from storage.buckets where id = 'private-cv'), false, 'CV bucket is private');
select is(
  (select allowed_mime_types from storage.buckets where id = 'private-cv'),
  array['application/pdf']::text[],
  'CV bucket accepts PDF only'
);

set local timezone = 'America/New_York';
select ok(
  (public.acquire_request_budget(
    'timezone_test', repeat('a', 43), repeat('b', 43),
    5, 600, 10, 3600, 100, 86400, 2, 45, true
  )->>'allowed')::boolean,
  'request budget works outside UTC'
);
select ok(
  exists(
    select 1 from public.request_quota
    where action = 'timezone_test'
      and bucket_start <= now()
      and expires_at > now()
  ),
  'request budget stores absolute timestamptz windows'
);

create temporary table timezone_lease_result as
select public.acquire_concurrency_lease(
  'timezone_lease_test', repeat('c', 43), 1, 45
) as lease_id;

select ok(
  (select lease_id is not null from timezone_lease_result)
  and exists(
    select 1 from public.request_lease
    where action = 'timezone_lease_test' and expires_at > now()
  ),
  'concurrency lease expiry remains valid outside UTC'
);

select lives_ok(
  $$select public.sync_github_projects(
    '[{"title":"Chess Game","description":"","category":"Systems","github_url":"https://github.com/Mouaz7/Chess-Game","languages":["C++"],"cover_image_href":"/project-icons/cplusplus.svg","sort_order":304,"source_kind":"github","github_full_name":"mouaz7/chess-game"}]'::jsonb,
    array['mouaz7/chess-game']::text[]
  )$$,
  'GitHub project sync accepts canonical repository casing'
);
select lives_ok(
  $$select public.sync_github_projects(
    '[{"title":"Chess Game","description":"","category":"Systems","github_url":"https://github.com/Mouaz7/chess-game/","languages":["C++"],"cover_image_href":"/project-icons/cplusplus.svg","sort_order":304,"source_kind":"github","github_full_name":"Mouaz7/Chess-Game"}]'::jsonb,
    array['mouaz7/chess-game']::text[]
  )$$,
  'GitHub project sync is idempotent across URL and name casing'
);
select is(
  (
    select count(*)
    from public.project
    where lower(github_full_name) = 'mouaz7/chess-game'
  ),
  1::bigint,
  'GitHub project sync retains one normalized repository identity'
);

select * from finish();
rollback;
