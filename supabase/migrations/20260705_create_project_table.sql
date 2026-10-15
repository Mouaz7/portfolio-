create extension if not exists pgcrypto;

create table if not exists public.project (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null,
  github_url text not null unique,
  languages text[] not null default '{}'::text[],
  cover_image_href text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists project_is_active_sort_order_idx
  on public.project (is_active, sort_order, created_at desc);
