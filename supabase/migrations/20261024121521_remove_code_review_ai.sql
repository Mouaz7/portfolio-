-- Remove the retired AI index after deploying the application without AI routes/jobs.
-- Keep portfolio content, private CV storage and contact abuse protection intact.
begin;

drop function if exists public.match_rag_chunks(extensions.vector, integer, double precision, text);
drop function if exists public.replace_rag_source(text, text, text, text, text, jsonb, jsonb);
drop function if exists public.acquire_job_lease(text, integer);
drop function if exists public.release_job_lease(text, uuid);

drop table if exists public.rag_chunk;
drop table if exists public.rag_source;
drop table if exists public.rag_index_run;
drop table if exists public.job_lease;

delete from public.request_quota
where action in ('cv_chat', 'code_review', 'code_review_chat');
delete from public.request_lease
where action in ('cv_chat', 'code_review', 'code_review_chat');

-- Preserve shared extensions and site_cv content; /api/cv serves its private PDF.
commit;
