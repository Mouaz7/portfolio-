# Mouaz Naji — Portfolio

> A modern, full-stack developer portfolio built with Next.js 15, React 19, TypeScript, Tailwind CSS v4 and Supabase. Every page sits on a shared, interactive "living constellation" backdrop and a database-driven dark/light theme.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com/)

## Features

- **Living constellation backdrop** — a single interactive `<canvas>` field of accent-coloured nodes that drift, link up when close and react to the pointer / touch. Rendered once globally so every page shares the exact same motif.
- **Database-driven theme** — dark & light modes with a cyan/teal accent stored in Supabase (`site_theme`) and injected as CSS variables at request time (no flash, no redeploy to recolour).
- **Fully dynamic content** — skills, projects, roadmap, the tech-stack marquee and the home stat cards are all pulled live from Supabase; nothing is hardcoded.
- **Interactive home hero** — kinetic gradient name, looping role cycler, magnetic CTA buttons, floating live-stat cards and an infinite tech-stack marquee.
- **Contact form** — email delivery via Nodemailer with file attachments, validation and rate limiting.
- **CV download** — streamed from Supabase Storage (`/api/cv`); swap the file in storage, no redeploy.
- **Responsive & accessible** — fluid `clamp()` sizing from phones to ultrawide, keyboard focus states, and full `prefers-reduced-motion` support (animations fall back to static frames).
- **SEO** — metadata, `sitemap.xml`, `robots.txt`.
- **Tested & CI/CD** — Jest + React Testing Library, with GitHub Actions for checks, Lighthouse and deployment.

## Tech Stack

| Area      | Tech |
|-----------|------|
| Framework | Next.js 15 (App Router), React 19 |
| Language  | TypeScript 5 |
| Styling   | Tailwind CSS v4, CSS variables |
| Animation | Framer Motion + custom canvas / CSS |
| Backend   | Supabase (PostgreSQL + Storage), Next.js Route Handlers |
| Email     | Nodemailer |
| Tooling   | ESLint, Jest, React Testing Library, GitHub Actions |

## Quick Start

### Prerequisites

- Node.js 20+
- A Supabase project (PostgreSQL + Storage)
- SMTP credentials for the contact form (Gmail app password, SendGrid, etc.)

### Installation

```bash
git clone https://github.com/Mouaz7/portfolio-.git
cd portfolio-
npm install
```

Create `.env.local` in the project root (see [`.env.example`](.env.example)):

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-or-publishable-key

# Contact form (SMTP)
CONTACT_TO=you@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
```

Set up the database and storage:

- Run [`supabase/setup.sql`](supabase/setup.sql) (and the `update_*.sql` seed scripts) in the Supabase SQL editor to create the `skill`, `skill_category`, `project`, `roadmap_item` and `site_theme` tables.
- Create a public Storage bucket `cv-icons` and upload your CV to `cv-icons/cv/CV.pdf`.

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — constellation hero with kinetic name, looping role cycler, CTAs, live stat cards and tech-stack marquee. |
| `/skills-page` | Skills grouped by category, icons served from Supabase. |
| `/roadmap-page` | Career/education timeline (`StreetTimeline`). |
| `/projects-page` | Projects with category filtering, tech tags and GitHub links. |
| `/contact-page` | Contact form with attachments, validation and rate limiting. |

All pages share the global header (wheel/swipe route navigation), theme toggle and constellation backdrop.

## Project Structure

```text
portofolio/
├── app/
│   ├── api/                # Route handlers: contact, cv, skills, skill-categories,
│   │                       #   project, roadmap, theme, health
│   ├── contact-page/ | projects-page/ | roadmap-page/ | skills-page/
│   ├── layout.tsx          # Root layout + global ConstellationField backdrop + DB theme
│   ├── page.tsx            # Home entry → home-page.tsx
│   ├── fonts.ts | global.css | robots.ts | sitemap.ts | error.tsx | global-error.tsx
├── components/
│   ├── home/               # ConstellationField, CursorGlow, FloatingStats, TechMarquee,
│   │                       #   MagneticButton, RoleCycler, ScrollHint
│   ├── contact/ | project/ | roadmap/ | skills/
│   ├── header.tsx | footer.tsx | ThemeToggle.tsx | SocialLinks.tsx
│   ├── RouteScrollNavigator.tsx | Stage16x9.tsx | LoadingAnimation.tsx
├── lib/
│   ├── backend/supabaseClient.ts
│   ├── contact/            # mailer.ts, validate.ts
│   └── theme.ts            # DB-driven theme → CSS variables
├── src/hooks/useAccentRgb.ts   # live accent colour for canvas animations
├── public/                 # logo.svg, logo1.svg, contact/*
├── supabase/               # setup.sql + seed/update scripts
├── __tests__/              # Jest + React Testing Library
└── .github/workflows/      # CI/CD, Lighthouse, PR checks
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon / publishable key | Yes |
| `CONTACT_TO` | Address that receives contact submissions | Yes |
| `SMTP_HOST` | SMTP server host | Yes |
| `SMTP_PORT` | SMTP port (usually 587) | Yes |
| `SMTP_USER` | SMTP username / email | Yes |
| `SMTP_PASS` | SMTP password / app password | Yes |

## Scripts

```bash
npm run dev       # Start the dev server (http://localhost:3000)
npm run build     # Production build
npm run start     # Start the production server
npm run lint      # ESLint
npm run test      # Jest (watch mode)
npm run test:ci   # Jest once, with coverage
```

## Deployment

Deploy to [Vercel](https://vercel.com): import the repo, add the environment variables above, and deploy. Pushes to `main` deploy automatically via GitHub Actions.

## License

Released under the MIT License.
