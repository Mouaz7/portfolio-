-- Mouaz Naji's CV stored in the database so the AI chatbot can ground every
-- answer on real facts (and so the CV copy can change without code edits).
-- Single-row table (id = 1). Readable by the app's anon key like the other
-- content tables. Also upgrades the database-driven `chatbot` UI icon.

create table if not exists public.site_cv (
  id         integer primary key default 1,
  content    text not null,
  updated_at timestamptz not null default now(),
  constraint site_cv_singleton check (id = 1)
);

alter table public.site_cv enable row level security;

drop policy if exists "site_cv read" on public.site_cv;
create policy "site_cv read" on public.site_cv for select using (true);

grant select on public.site_cv to anon, authenticated;

insert into public.site_cv (id, content, updated_at)
values (1, $cv$# Mouaz Naji — Software Engineer

- Email: mouaz.naji.dev@gmail.com
- LinkedIn: linkedin.com/in/mouaz-naji
- GitHub: github.com/Mouaz7
- Location: Karlskrona, Sweden

## Education
B.Sc. in Software Engineering — Blekinge Institute of Technology (BTH), Karlskrona, Sweden. 2023–2026.

## Skills
- Frontend & Mobile: Kotlin, Jetpack Compose, React, TypeScript, JavaScript, Next.js, Tailwind CSS, Vue 3
- Backend & Systems: C++, C, x86 Assembly, network protocols, cryptography, Python, Bun, Node.js, Java
- APIs & Storage: REST, GraphQL, PostgreSQL, MariaDB, Firestore
- Cloud, DevOps & Testing: GCP, Firebase, Docker, CI/CD, Pytest, Git, Linux
- AI/ML & Data: LLM integration, function calling, prompt design

## Soft skills
Problem solving, critical thinking, communication, team collaboration, leadership, mentoring.

## Languages
Swedish, Arabic, English.

## Work experience
### Full-Stack Developer Intern — TeamTemp (Softhouse, Karlskrona) — Jan 2026 to May 2026
- Developed a complex survey application with an admin and user portal for Android and iOS.
- Implemented conditional logic and an AI helper tool for managing and creating surveys.
- Built the backend infrastructure using Bun.

### Student Mentor — Blekinge Institute of Technology (Karlskrona) — Sep 2025 to Jun 2026
- Supported onboarding of new software engineering students.
- Delivered guided problem-solving sessions.
- Facilitated collaboration and student retention.

### C++ Teaching Assistant (Object-Oriented Programming) — Blekinge Institute of Technology (Karlskrona) — Sep 2025 to Jun 2026
- Assisted students with core C++ and object-oriented concepts.
- Provided guidance during lab sessions and coursework.
- Clarified complex programming problems to support learning.

### Full-Stack Developer Intern — Pong Pal (Softhouse, Karlskrona) — Jan 2025 to May 2025
- Built a real-time system integrating Slack and Firebase.
- Built a serverless backend using Cloud Functions and Firestore.
- Created custom Slack commands and a React admin dashboard.

## Projects
- Professional Portfolio (Frontend, 3D rendering, UI/UX): Interactive engineering portfolio with a premium visual aesthetic, stylized 3D graphics, and modern web layout principles.
- Auto-Healing DevOps Platform (Python, NLP, AI/ML): Automated platform using NLP and search algorithms that parses, classifies, and repairs unstructured text logs in distributed networks.
- Move-Out: Moving Box System (Full-Stack, Node.js, React, Firebase): Web app for managing moving boxes via QR codes, deployed with CI/CD on Google Cloud Run with custom security.
- Campus360: Hybrid Navigation App (Kotlin, Jetpack Compose, MVVM): Hybrid indoor/outdoor navigation using Google Maps with an MVVM architecture and reactive Jetpack Compose UI.
- PongPal Showcase (React, Firebase, Serverless): Showcase repository for real-time Slack and Firebase integration with an event-driven Cloud Functions backend.
- TeamTemp App (Bun, Kotlin, Swift, AI): Cross-platform survey architecture for iOS and Android with conditional logic and embedded AI assistance.
- Os_filesystem (C++, Linux): Custom file system with inodes, blocks, and permissions, giving deep insight into OS internals and storage management.

## References
Josefin Petersson — Softhouse (josefin.petersson@softhouse.se). Further references available on request.
$cv$, now())
on conflict (id) do update
  set content = excluded.content, updated_at = now();

-- Chatbot icon: a clean chat bubble with an AI sparkle inside.
update public.ui_icon
set svg_path = 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-4 3v-3a2 2 0 0 1-2-2V6ZM12 7.7l.95 2.25 2.25.95-2.25.95L12 14.3l-.95-2.25L8.8 11.1l2.25-.95L12 7.7Z',
    viewbox = '0 0 24 24'
where name = 'chatbot';
