-- ============================================================
--  Chat analytics for unanswered public portfolio questions
--  Server-side inserts only via SUPABASE_SERVICE_ROLE_KEY.
-- ============================================================

create table if not exists public.unanswered_chat_logs (
  id bigint generated always as identity primary key,
  question_masked text not null,
  question_hash text not null,
  language text not null check (language in ('en', 'sv', 'ar')),
  detected_intent text not null,
  source text not null,
  created_at timestamptz not null default now()
);

create index if not exists unanswered_chat_logs_created_at_idx
  on public.unanswered_chat_logs (created_at desc);

create index if not exists unanswered_chat_logs_question_hash_idx
  on public.unanswered_chat_logs (question_hash);

alter table public.unanswered_chat_logs enable row level security;

revoke all on public.unanswered_chat_logs from anon, authenticated;
revoke all on sequence public.unanswered_chat_logs_id_seq from anon, authenticated;
