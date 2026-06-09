-- ============================================================
-- Uppdatering med Mouaz Naji CV-data (2026-06-08)
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- SKILL CATEGORIES (uppdatera + lägg till AI/ML)
-- ──────────────────────────────────────────────────────────
DELETE FROM public.skill;
DELETE FROM public.skill_category;

INSERT INTO public.skill_category (name, title, blurb) VALUES
  ('frontend', 'Frontend & Mobile',       'Web & native UIs with React, Next.js, Kotlin and Jetpack Compose.'),
  ('backend',  'Backend & Systems',       'Low-level systems and APIs in C++, x86 Assembly, Python and Node.'),
  ('storage',  'APIs & Storage',          'REST/GraphQL services over PostgreSQL, MariaDB and Firestore.'),
  ('devops',   'Cloud, DevOps & Testing', 'Ship and test on GCP, Firebase, Docker and CI/CD pipelines.'),
  ('ai',       'AI/ML & Data',            'LLM integration, function calling and prompt engineering.');

-- ──────────────────────────────────────────────────────────
-- SKILLS — exakt från CV med Devicon CDN-ikoner
-- ──────────────────────────────────────────────────────────
INSERT INTO public.skill (name, category, icon_bucket, icon_path, icon_alt) VALUES
  -- Frontend & Mobile
  ('Kotlin',           'frontend', '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg',            'Kotlin'),
  ('Jetpack Compose',  'frontend', '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jetpackcompose/jetpackcompose-original.svg', 'Jetpack Compose'),
  ('React',            'frontend', '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',              'React'),
  ('TypeScript',       'frontend', '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',    'TypeScript'),
  ('JavaScript',       'frontend', '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',    'JavaScript'),
  ('Next.js',          'frontend', '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',            'Next.js'),
  ('Tailwind CSS',     'frontend', '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg',  'Tailwind CSS'),
  ('Vue 3',            'frontend', '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',              'Vue 3'),

  -- Backend & Systems
  ('C++',              'backend',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',      'C++'),
  ('C',                'backend',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',                      'C'),
  ('x86 Assembly',     'backend',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nixos/nixos-original.svg',              'x86 Assembly'),
  ('Python',           'backend',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',            'Python'),
  ('Bun',              'backend',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bun/bun-original.svg',                  'Bun'),
  ('Node.js',          'backend',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',            'Node.js'),
  ('Java',             'backend',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',                'Java'),

  -- APIs & Storage
  ('GraphQL',          'storage',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg',             'GraphQL'),
  ('PostgreSQL',       'storage',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',    'PostgreSQL'),
  ('MariaDB',          'storage',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mariadb/mariadb-original.svg',          'MariaDB'),
  ('Firestore',        'storage',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg',           'Firestore'),

  -- Cloud, DevOps & Testing
  ('GCP',              'devops',   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg',  'Google Cloud'),
  ('Firebase',         'devops',   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg',           'Firebase'),
  ('Docker',           'devops',   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',            'Docker'),
  ('Pytest',           'devops',   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytest/pytest-original.svg',            'Pytest'),
  ('Git',              'devops',   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',                  'Git'),
  ('Linux',            'devops',   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg',              'Linux'),
  ('CI/CD',            'devops',   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/githubactions/githubactions-original.svg', 'CI/CD'),

  -- AI/ML & Data
  ('LLM Integration',  'ai',       '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',            'LLM Integration'),
  ('Function Calling', 'ai',       '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/openai/openai-original.svg',            'Function Calling'),
  ('Prompt Design',    'ai',       '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/openai/openai-original.svg',            'Prompt Design');

-- ──────────────────────────────────────────────────────────
-- PROJECTS — exakt från CV
-- ──────────────────────────────────────────────────────────
DELETE FROM public.project;

INSERT INTO public.project (title, description, category, github_url, languages, sort_order, is_active) VALUES
  ('Move-Out: Moving Box System',
   'Web app for managing moving boxes via QR codes. Implemented bcrypt, CSRF/XSS protection, and rate limiting. Deployed with CI/CD on Google Cloud Run.',
   'Full-Stack',
   'https://github.com/Mouaz7/Move-Out',
   ARRAY['Node.js', 'React', 'Firebase', 'GCP', 'CI/CD'],
   1, true),

  ('Campus360: Hybrid Navigation App',
   'Hybrid indoor/outdoor navigation app using Google Maps. MVVM architecture with reactive Jetpack Compose UI.',
   'Mobile',
   'https://github.com/Mouaz7/Campus360',
   ARRAY['Kotlin', 'Jetpack Compose', 'MVVM', 'Google Maps'],
   2, true),

  ('Asm-Buffered-IO',
   'High-performance buffered I/O using low-level syscalls. Optimized memory access and system call overhead.',
   'Systems',
   'https://github.com/Mouaz7/Asm-Buffered-IO',
   ARRAY['C++', 'x86 Assembly'],
   3, true),

  ('Os_filesystem',
   'Custom file system with inodes, blocks, and permissions. Deep insight into OS internals and storage management.',
   'Systems',
   'https://github.com/Mouaz7/Os_filesystem',
   ARRAY['C++', 'Linux'],
   4, true),

  ('Chess Game',
   'Fully functional chess engine with complete rules. Check/checkmate detection with clean architecture.',
   'Build',
   'https://github.com/Mouaz7/Chess-Game',
   ARRAY['C++', 'OOP', 'Algorithms'],
   5, true);

-- ──────────────────────────────────────────────────────────
-- ROADMAP — exakt från CV med rätta datum
-- ──────────────────────────────────────────────────────────
DELETE FROM public.roadmap_item;

INSERT INTO public.roadmap_item (title, details, start_date, end_date, icon_bucket, icon_path, icon_alt) VALUES
  ('B.Sc. Software Engineering @ BTH',
   'Bachelor''s degree in Software Engineering at Blekinge Institute of Technology, Karlskrona. Covering algorithms, OS, distributed systems, software architecture and agile development.',
   '2023-08-28 00:00:00+00',
   '2026-06-15 00:00:00+00',
   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg', 'BTH'),

  ('Full-Stack Developer Intern (Pong Pal) @ Softhouse',
   'Built real-time system integrating Slack and Firebase. Serverless backend using Cloud Functions and Firestore. Custom Slack commands and React admin dashboard.',
   '2025-01-13 00:00:00+00',
   '2025-05-31 00:00:00+00',
   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg', 'Softhouse'),

  ('Student Mentor @ BTH',
   'Supported onboarding of new software engineering students. Delivered guided problem-solving sessions. Facilitated collaboration and student retention.',
   '2025-09-01 00:00:00+00',
   '2026-06-15 00:00:00+00',
   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg', 'BTH Mentor'),

  ('C++ Teaching Assistant (OOP) @ BTH',
   'Assisted students with core C++ and object-oriented concepts. Provided guidance during lab sessions and coursework. Clarified complex programming problems to support learning.',
   '2025-09-01 00:00:00+00',
   '2026-06-15 00:00:00+00',
   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg', 'C++ TA'),

  ('Full-Stack Developer Intern (TeamTemp) @ Softhouse',
   'Developed a complex survey application with an admin and user portal for Android and iOS. Implemented conditional logic and an AI helper tool for managing and creating surveys. Built the backend infrastructure utilizing Bun.',
   '2026-01-13 00:00:00+00',
   '2026-05-31 00:00:00+00',
   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', 'Softhouse');
