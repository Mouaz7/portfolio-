-- ============================================================
--  Contact page data (read by /api/contact via PostgREST)
--  Run this in the Supabase SQL editor, or apply with psql.
-- ============================================================

-- ---------- Social links ----------
create table if not exists public.contact_social (
  id          bigint generated always as identity primary key,
  name        text not null,
  href        text not null,
  svg_path    text not null,
  viewbox     text not null default '0 0 24 24',
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.contact_social enable row level security;
drop policy if exists "contact_social public read" on public.contact_social;
create policy "contact_social public read"
  on public.contact_social for select using (is_active = true);

insert into public.contact_social (name, href, svg_path, viewbox, sort_order) values
('GitHub', 'https://github.com/Mouaz7',
 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z',
 '0 0 16 16', 1),
('LinkedIn', 'https://www.linkedin.com/in/mouaz-naji',
 'M13.6 0H2.4A2.4 2.4 0 0 0 0 2.4v11.2A2.4 2.4 0 0 0 2.4 16h11.2a2.4 2.4 0 0 0 2.4-2.4V2.4A2.4 2.4 0 0 0 13.6 0ZM5 13H3V6h2v7Zm-1-8a1.2 1.2 0 1 1 0-2.4A1.2 1.2 0 0 1 4 5Zm9 8h-2V9.5c0-.8-.3-1.4-1.1-1.4-.6 0-.9.4-1.1.8-.1.2-.1.4-.1.6V13H7.7V6h2v.9c.3-.4.8-1 1.9-1 1.4 0 2.4.9 2.4 2.8V13Z',
 '0 0 16 16', 2),
('Email', 'mailto:mouaz.naji.dev@gmail.com',
 'M2 4h12a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm0 1.4V5l6 4 6-4v.4l-6 4-6-4Z',
 '0 0 16 16', 3),
('Beacons', 'https://beacons.ai/mouaz98',
 'M7.78 1.97a3.5 3.5 0 0 1 4.95 4.95l-1.5 1.5-1.06-1.06 1.5-1.5a2 2 0 0 0-2.83-2.83l-1.5 1.5L6.28 3.47l1.5-1.5ZM3.47 6.28 4.53 7.34l-1.5 1.5a2 2 0 1 0 2.83 2.83l1.5-1.5 1.06 1.06-1.5 1.5a3.5 3.5 0 1 1-4.95-4.95l1.5-1.5Zm1.06 4.25L10.53 4.53 9.47 3.47 3.47 9.47l1.06 1.06Z',
 '0 0 16 16', 4);

-- ---------- Selectable labels ----------
create table if not exists public.contact_label (
  id          bigint generated always as identity primary key,
  text        text not null,
  color       text not null,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.contact_label enable row level security;
drop policy if exists "contact_label public read" on public.contact_label;
create policy "contact_label public read"
  on public.contact_label for select using (is_active = true);

insert into public.contact_label (text, color, sort_order) values
('available for hire', '#3fb950', 1),
('open to collab',     '#58a6ff', 2),
('tech & design',      '#a371f7', 3);
