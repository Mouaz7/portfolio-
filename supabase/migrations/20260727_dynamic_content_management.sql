create extension if not exists pgcrypto;

-- Home content is data-driven while icon keys remain constrained by the UI.
create table if not exists public.site_profile (
  id uuid primary key,
  intro_prefix text not null default 'I’m ',
  display_name text not null,
  role_prefix text not null default 'Software ',
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.home_role (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.home_capability (
  id text primary key,
  title text not null,
  description text not null,
  icon_key text not null check (icon_key in ('backend', 'ai', 'secure-web', 'cloud-devops', 'quality')),
  sort_order integer not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists home_role_sort_order_key on public.home_role (sort_order);
create index if not exists home_role_active_sort_order_idx on public.home_role (is_active, sort_order);
create index if not exists home_capability_active_sort_order_idx on public.home_capability (is_active, sort_order);

insert into public.site_profile (id, intro_prefix, display_name, role_prefix)
values ('00000000-0000-0000-0000-000000000001', 'I’m ', 'Mouaz', 'Software ')
on conflict (id) do nothing;

insert into public.home_role (label, sort_order)
values
  ('Engineer', 10),
  ('Designer', 20),
  ('Development', 30),
  ('AI', 40),
  ('Web', 50),
  ('Cyber Security', 60),
  ('Engineer', 70)
on conflict (sort_order) do nothing;

insert into public.home_capability (id, title, description, icon_key, sort_order)
values
  ('backend', 'Backend Systems', 'APIs, databases and scalable architecture', 'backend', 10),
  ('ai', 'AI Integrations', 'LLMs, automation and intelligent workflows', 'ai', 20),
  ('secure-web', 'Secure Web', 'Authentication, validation and reliable systems', 'secure-web', 30),
  ('cloud-devops', 'Cloud & DevOps', 'CI/CD, containers and reliable deployments', 'cloud-devops', 40),
  ('quality', 'Quality Engineering', 'Testing, observability and system reliability', 'quality', 50)
on conflict (id) do nothing;

-- Runtime tables used by the portfolio. ADD COLUMN keeps deployed data intact.
create table if not exists public.skill_category (
  name text primary key,
  title text not null,
  blurb text not null default '',
  sort_order integer not null default 0,
  accent_rgb text,
  is_active boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.skill_category add column if not exists title text;
alter table public.skill_category add column if not exists blurb text;
alter table public.skill_category add column if not exists sort_order integer not null default 0;
alter table public.skill_category add column if not exists accent_rgb text;
alter table public.skill_category add column if not exists is_active boolean not null default true;
alter table public.skill_category add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists skill_category_active_sort_order_idx on public.skill_category (is_active, sort_order);

insert into public.skill_category (name, title, blurb, sort_order)
values
  ('frontend', 'Frontend & Mobile', 'Interfaces, frameworks, and app experiences for the browser and mobile.', 10),
  ('mobile', 'Mobile', 'Native and cross-platform apps for phones and tablets.', 20),
  ('backend', 'Backend & Systems', 'Services, system logic, and the code that powers everything behind the scenes.', 30),
  ('storage', 'APIs & Storage', 'APIs, databases, and the data layer that keeps apps reliable.', 40),
  ('devops', 'Cloud, DevOps & Testing', 'Deployment, automation, testing, and calm release workflows.', 50),
  ('ai', 'AI/ML & Data', 'LLMs, prompts, intelligent workflows, and data-driven features.', 60),
  ('ides', 'IDEs & Design', 'Editors and design tools that shape the dev loop.', 70),
  ('workflow', 'Tools & Workflow', 'Testing, tracking, and the glue for calm collaboration.', 80),
  ('webdata', 'Web & Data', 'Web fundamentals, servers, and database tooling.', 90)
on conflict (name) do nothing;

create table if not exists public.skill (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  icon_bucket text,
  icon_path text,
  icon_path_light text,
  icon_alt text,
  mono boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.skill add column if not exists sort_order integer not null default 0;
alter table public.skill add column if not exists is_active boolean not null default true;
alter table public.skill add column if not exists updated_at timestamptz not null default timezone('utc', now());
create unique index if not exists skill_category_skill_name_key on public.skill (category, name);
create index if not exists skill_active_category_sort_order_idx on public.skill (is_active, category, sort_order, created_at);

with skill_order(category, name, sort_order) as (
  values
    ('frontend', 'TypeScript', 10), ('frontend', 'JavaScript', 20), ('frontend', 'React', 30), ('frontend', 'Next.js', 40), ('frontend', 'Vue 3', 50), ('frontend', 'Tailwind CSS', 60),
    ('mobile', 'Kotlin', 10), ('mobile', 'Swift', 20), ('mobile', 'Flutter', 30), ('mobile', 'Dart', 40), ('mobile', 'Android', 50), ('mobile', 'Firebase', 60),
    ('backend', 'Python', 10), ('backend', 'Java', 20), ('backend', 'C++', 30), ('backend', 'C', 40), ('backend', 'Bun', 50), ('backend', 'x86 Asm', 60),
    ('storage', 'Node.js', 10), ('storage', 'GraphQL', 20), ('storage', 'PostgreSQL', 30), ('storage', 'MySQL', 40), ('storage', 'MariaDB', 50), ('storage', 'SQL', 60),
    ('devops', 'Docker', 10), ('devops', 'Git', 20), ('devops', 'GitHub', 30), ('devops', 'CI/CD', 40), ('devops', 'Linux', 50), ('devops', 'Pytest', 60),
    ('ai', 'LLM Integration', 10), ('ai', 'Function Calling', 20), ('ai', 'Prompt Design', 30),
    ('ides', 'VS Code', 10), ('ides', 'Visual Studio', 20), ('ides', 'Figma', 30), ('ides', 'Bitbucket', 40), ('ides', 'Premiere Pro', 50),
    ('workflow', 'Jira', 10), ('workflow', 'Trello', 20), ('workflow', 'Cypress', 30), ('workflow', 'Jenkins', 40), ('workflow', 'Vercel', 50), ('workflow', 'Bash', 60),
    ('webdata', 'HTML5', 10), ('webdata', 'CSS3', 20), ('webdata', 'PHP', 30), ('webdata', 'Flask', 40), ('webdata', 'Express', 50), ('webdata', 'MongoDB', 60)
)
update public.skill as skill
set sort_order = skill_order.sort_order
from skill_order
where skill.category = skill_order.category
  and skill.name = skill_order.name
  and skill.sort_order = 0;

create table if not exists public.journey_item (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  details text not null default '',
  start_date timestamptz not null,
  end_date timestamptz,
  icon_bucket text,
  icon_path text,
  icon_alt text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.journey_item add column if not exists sort_order integer not null default 0;
alter table public.journey_item add column if not exists is_active boolean not null default true;
alter table public.journey_item add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists journey_item_active_date_idx on public.journey_item (is_active, start_date desc, sort_order);

create table if not exists public.contact_social (
  id bigint generated by default as identity primary key,
  name text not null,
  href text not null,
  svg_path text,
  viewbox text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.contact_social add column if not exists is_active boolean not null default true;
alter table public.contact_social add column if not exists sort_order integer not null default 0;
alter table public.contact_social add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists contact_social_active_sort_order_idx on public.contact_social (is_active, sort_order);

create table if not exists public.site_cv (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.site_cv add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.profile (
  id uuid primary key default gen_random_uuid(),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.profile add column if not exists updated_at timestamptz not null default timezone('utc', now());

-- GitHub discovery may add projects, but Supabase remains the presentation source of truth.
alter table public.project add column if not exists source_kind text not null default 'github';
alter table public.project add column if not exists github_full_name text;
alter table public.project add column if not exists sync_enabled boolean not null default true;
alter table public.project add column if not exists last_synced_at timestamptz;
alter table public.project add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table public.project drop constraint if exists project_source_kind_check;
alter table public.project add constraint project_source_kind_check check (source_kind in ('github', 'manual'));
create unique index if not exists project_github_full_name_key on public.project (github_full_name) where github_full_name is not null;
create index if not exists project_source_sync_idx on public.project (source_kind, sync_enabled);
