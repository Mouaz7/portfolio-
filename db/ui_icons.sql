-- ============================================================
--  Shared UI icons (read by /api/ui-icons and /api/contact)
--  Run this in the Supabase SQL editor, or apply with psql.
-- ============================================================

create table if not exists public.ui_icon (
  name       text primary key,
  svg_path   text not null,
  viewbox    text not null default '0 0 24 24',
  created_at timestamptz not null default now()
);

alter table public.ui_icon enable row level security;
drop policy if exists "ui_icon public read" on public.ui_icon;
create policy "ui_icon public read"
  on public.ui_icon for select using (true);

insert into public.ui_icon (name, svg_path, viewbox) values
('chatbot',
 'M12 3v3m-5.5 4.5A4.5 4.5 0 0 1 11 6h2a4.5 4.5 0 0 1 4.5 4.5v4A4.5 4.5 0 0 1 13 19h-2a4.5 4.5 0 0 1-4.5-4.5v-4Zm-2 1.5h2m13 0h2M9.25 12h.01M14.75 12h.01M9.5 15c1.35.9 3.65.9 5 0',
 '0 0 24 24')
on conflict (name) do update
set svg_path = excluded.svg_path,
    viewbox = excluded.viewbox;
