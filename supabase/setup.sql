-- ============================================================
-- Mouaz Naji Portfolio – Supabase Setup
-- Kör detta i Supabase SQL Editor (supabase.com > SQL Editor > New query)
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. STORAGE BUCKET  (cv-icons – public)
-- ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-icons', 'cv-icons', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read cv-icons" ON storage.objects;
CREATE POLICY "Public read cv-icons"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cv-icons');

-- ──────────────────────────────────────────────────────────
-- 2. SKILL_CATEGORY
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.skill_category (
  name  text PRIMARY KEY,
  title text NOT NULL,
  blurb text
);

ALTER TABLE public.skill_category ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read skill_category" ON public.skill_category;
CREATE POLICY "Public read skill_category"
  ON public.skill_category FOR SELECT USING (true);

INSERT INTO public.skill_category (name, title, blurb) VALUES
  ('frontend', 'Frontend & Mobile',       'Web & native UIs with React, Next.js and Kotlin.'),
  ('backend',  'Backend & Systems',       'APIs and low-level systems in C++, Python and Node.'),
  ('storage',  'APIs & Storage',          'REST/GraphQL services over SQL and Firebase.'),
  ('devops',   'Cloud, DevOps & Testing', 'Ship and test on GCP, Docker and CI/CD.')
ON CONFLICT (name) DO UPDATE
  SET title = EXCLUDED.title, blurb = EXCLUDED.blurb;

-- ──────────────────────────────────────────────────────────
-- 3. SKILL
--    icon_path = full https:// URL → served directly by /api/skills
--    icon_bucket = '' (unused when icon_path is external URL)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.skill (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  category    text        REFERENCES public.skill_category(name),
  icon_bucket text        NOT NULL DEFAULT '',
  icon_path   text        NOT NULL,
  icon_alt    text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.skill ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read skill" ON public.skill;
CREATE POLICY "Public read skill"
  ON public.skill FOR SELECT USING (true);

INSERT INTO public.skill (name, category, icon_bucket, icon_path, icon_alt) VALUES
  -- Frontend & Mobile
  ('React',      'frontend', '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',            'React'),
  ('TypeScript',  'frontend', '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',  'TypeScript'),
  ('JavaScript',  'frontend', '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',  'JavaScript'),
  ('Tailwind',    'frontend', '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg','Tailwind CSS'),
  ('Kotlin',      'frontend', '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg',          'Kotlin'),
  ('Vue 3',       'frontend', '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',            'Vue.js'),
  -- Backend & Systems
  ('C++',         'backend',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',    'C++'),
  ('C',           'backend',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',                    'C'),
  ('Python',      'backend',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',          'Python'),
  ('Node.js',     'backend',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',          'Node.js'),
  ('Java',        'backend',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',              'Java'),
  ('Bun',         'backend',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bun/bun-original.svg',                'Bun'),
  -- APIs & Storage
  ('PostgreSQL',  'storage',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',  'PostgreSQL'),
  ('MariaDB',     'storage',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mariadb/mariadb-original.svg',        'MariaDB'),
  ('GraphQL',     'storage',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg',           'GraphQL'),
  ('Firebase',    'storage',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg',         'Firebase'),
  -- Cloud, DevOps & Testing
  ('GCP',         'devops',   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg','Google Cloud'),
  ('Docker',      'devops',   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',          'Docker'),
  ('Git',         'devops',   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',                'Git'),
  ('Linux',       'devops',   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg',            'Linux'),
  ('Pytest',      'devops',   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytest/pytest-original.svg',          'Pytest');

-- ──────────────────────────────────────────────────────────
-- 4. PROJECT
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text        NOT NULL,
  description      text,
  category         text        DEFAULT 'Build',
  github_url       text,
  languages        text[]      DEFAULT '{}',
  cover_image_href text,
  sort_order       integer     DEFAULT 0,
  is_active        boolean     DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read project" ON public.project;
CREATE POLICY "Public read project"
  ON public.project FOR SELECT USING (true);

INSERT INTO public.project (title, description, category, github_url, languages, sort_order, is_active) VALUES
  ('Move-Out',
   'Android app for documenting move-out inspections. Tenants and landlords record room conditions, damage reports and signatures digitally — no paper needed.',
   'Mobile',
   'https://github.com/Mouaz7/Move-Out',
   ARRAY['Kotlin', 'Jetpack Compose', 'Firebase', 'Android'],
   1, true),

  ('Campus360',
   'Full-stack campus social platform where students can connect, share events and collaborate. Vue 3 SPA backed by a Python/FastAPI REST API and PostgreSQL.',
   'Full-Stack',
   'https://github.com/Mouaz7/Campus360',
   ARRAY['Vue 3', 'TypeScript', 'Python', 'FastAPI', 'PostgreSQL'],
   2, true),

  ('Asm-Buffered-IO',
   'High-performance buffered I/O library written in x86-64 Assembly. Demonstrates low-level memory management, system calls and manual buffer-flush strategies.',
   'Systems',
   'https://github.com/Mouaz7/Asm-Buffered-IO',
   ARRAY['Assembly', 'x86-64', 'Linux'],
   3, true),

  ('OS Filesystem',
   'Custom file system built from scratch in C. Covers inode structures, directory traversal, file allocation tables and POSIX-like read/write/delete operations.',
   'Systems',
   'https://github.com/Mouaz7/Os_filesystem',
   ARRAY['C', 'Operating Systems', 'Linux'],
   4, true),

  ('Chess Game',
   'Object-oriented Chess implementation in Java with full rule enforcement: castling, en passant, promotion, and check/checkmate detection.',
   'Build',
   'https://github.com/Mouaz7/Chess-Game',
   ARRAY['Java', 'OOP', 'Algorithms'],
   5, true);

-- ──────────────────────────────────────────────────────────
-- 5. ROADMAP_ITEM
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roadmap_item (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  details     text,
  start_date  timestamptz NOT NULL,
  end_date    timestamptz,
  icon_bucket text        DEFAULT '',
  icon_path   text,
  icon_alt    text
);

ALTER TABLE public.roadmap_item ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read roadmap_item" ON public.roadmap_item;
CREATE POLICY "Public read roadmap_item"
  ON public.roadmap_item FOR SELECT USING (true);

INSERT INTO public.roadmap_item (title, details, start_date, end_date, icon_path, icon_alt) VALUES
  ('B.Sc. Software Engineering @ BTH',
   'Bachelor''s degree in Software Engineering at Blekinge Institute of Technology, Karlskrona. Covering algorithms, OS, distributed systems, software architecture and agile development.',
   '2023-08-28 00:00:00+00',
   '2026-06-15 00:00:00+00',
   'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
   'BTH'),

  ('Teaching Assistant – C++',
   'TA for the C++ programming course at BTH. Held lab sessions, reviewed student code and helped debug complex pointer/memory issues.',
   '2024-01-15 00:00:00+00',
   '2024-06-01 00:00:00+00',
   'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
   'C++'),

  ('Student Mentor @ BTH',
   'Mentored first-year students, guiding them through university life, study techniques and the first programming courses.',
   '2024-09-01 00:00:00+00',
   '2025-06-01 00:00:00+00',
   'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
   'Mentor'),

  ('Internship @ Softhouse',
   'Software development internship at Softhouse Consulting, Karlskrona. Worked on real client projects with modern web technologies in an agile team.',
   '2025-01-13 00:00:00+00',
   '2025-06-06 00:00:00+00',
   'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
   'Softhouse'),

  ('Freelance & Open Source',
   'Building side projects, contributing to open source and continuously expanding the tech stack — currently focused on full-stack web and mobile development.',
   '2025-06-07 00:00:00+00',
   NULL,
   'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
   'Open Source');

-- ──────────────────────────────────────────────────────────
-- DONE ✓
-- Nästa steg:
--   1. Gå till Storage → skapa bucket "cv-icons" om den inte visas
--   2. Ladda upp ditt CV-fil som:  cv/CV.pdf  i bucketen
--   3. Kopiera Project URL + anon key från Settings → API
--   4. Lägg in dem i .env.local
-- ──────────────────────────────────────────────────────────
