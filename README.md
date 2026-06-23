<div align="center">

# Mouaz Naji · Developer Portfolio

A full stack developer portfolio with a **git themed identity** — the career page reads like a real `git log graph`, the projects page is a live **GitHub repositories** clone, and the contact form is a **GitHub New Issue** editor. Built on Next.js 15, React 19, TypeScript, Tailwind and Supabase.

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-22c55e)](#license)

[Live site](https://portfolio-lemon-chi.vercel.app) · [Report an issue](https://github.com/Mouaz7/portfolio-/issues)

</div>

---

## ✨ What Makes It Different

This is not a generic template. The whole site speaks one language — **the tools developers actually use** — so it stays cohesive and memorable:

| Page | Concept |
| :-- | :-- |
| 🛣️ **Roadmap** | The career and education timeline rendered as a real `git log graph`, with branches for each organisation, commit nodes, hashes and branch tags. |
| 📦 **Projects** | A faithful **GitHub repositories** page. Repos load live from the GitHub API (stars, language, last push), sorted newest first, with search, filters and topic pills. |
| 💬 **Contact** | A **GitHub New Issue** form with a Google Docs style rich text editor (bold, italic, code, link, quote, list), drag and drop attachments, selectable labels and a sidebar. |
| ⏳ **Loading** | A tiny terminal window that runs `git pull` while data fetches. |

Everything sits on one shared, interactive **living constellation** backdrop and a **database driven theme** (dark and light, cyan accent) so the look never breaks between pages.

## 🚀 Features

- **Living constellation backdrop** — a single interactive canvas of accent coloured nodes that drift, link when close and react to the pointer. Rendered once globally so every page shares it.
- **Database driven theme** — dark and light modes with the accent stored in Supabase and injected as CSS variables at request time. No flash, no redeploy to recolour.
- **Dynamic content** — skills, projects, roadmap, stats and the tech marquee all load live from Supabase. The projects page also merges in live data straight from the GitHub API.
- **Interactive home hero** — kinetic gradient name, looping role cycler, magnetic buttons, live stat cards and an infinite tech marquee.
- **Rich contact form** — email delivery through Nodemailer with attachments, validation and rate limiting.
- **CV download** — streamed from Supabase Storage. Swap the file in storage, no redeploy.
- **Responsive and accessible** — fluid sizing from phone to ultrawide, keyboard focus states and full reduced motion support.
- **SEO** — metadata, sitemap and robots.
- **Tested with CI** — Jest and React Testing Library, with GitHub Actions for checks, Lighthouse and deployment.

## 🧱 Tech Stack

| Area | Tech |
| :-- | :-- |
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4, CSS variables |
| Animation | Framer Motion plus custom canvas and CSS |
| Backend | Supabase (PostgreSQL and Storage), Next.js route handlers |
| Live data | GitHub REST API (projects page) |
| Email | Nodemailer |
| Tooling | ESLint, Jest, React Testing Library, GitHub Actions |

## 🗺️ Pages

| Route | Description |
| :-- | :-- |
| `/` | Home — constellation hero with kinetic name, role cycler, live stat cards and tech marquee. |
| `/skills` | Skills grouped by category, icons served from Supabase. |
| `/roadmap` | Career and education as a git graph timeline. |
| `/projects` | GitHub repositories view — live repos, search, category filters and sorting. |
| `/contact` | GitHub issue style contact form with a rich text editor and attachments. |

All pages share the global header (wheel and swipe navigation), theme toggle and constellation backdrop.

## ⚡ Quick Start

### Prerequisites

- Node.js 20 or newer
- A Supabase project (PostgreSQL and Storage)
- SMTP credentials for the contact form (a Gmail app password works)

### Install

```bash
git clone https://github.com/Mouaz7/portfolio-.git
cd portfolio-
npm install
```

Create a `.env.local` file in the project root (see `.env.example`):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-publishable-key

CONTACT_TO=you@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
```

Set up the database and storage:

- Run the scripts in `supabase/` in the Supabase SQL editor to create the `skill`, `skill_category`, `project`, `roadmap_item` and `site_theme` tables, plus the contact tables in `db/contact_social.sql`.
- Create a public Storage bucket named `cv-icons` and upload your CV to `cv-icons/cv/CV.pdf`.

Run the dev server:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## 🗂️ Project Structure

```text
portofolio/
├── app/
│   ├── skills/ projects/ roadmap/ contact/   one page per route
│   ├── api/            route handlers: contact, cv, skills, project, roadmap, health
│   ├── layout.tsx      root layout, global backdrop and database theme
│   ├── page.tsx        home (server) — fetches profile, renders the hero
│   └── global.css      design tokens and theme variables
├── components/
│   ├── layout/         header, footer, theme toggle, backdrop, navigation
│   ├── ui/             loading animation (terminal style)
│   ├── home/           hero, cursor glow, magnetic buttons, role cycler
│   ├── roadmap/        GitGraphTimeline (the git log graph)
│   ├── projects/       GithubRepoRow (the repositories list)
│   └── contact/        ContactIssueForm (the new issue editor)
├── lib/
│   ├── hooks/          live accent colour for the canvas
│   ├── supabase/       Supabase client
│   ├── contact/        mailer and validation
│   └── theme.ts        database theme to CSS variables
├── db/                 contact tables (social links and labels)
├── supabase/           setup and seed scripts
├── public/             logo and assets
├── __tests__/          Jest and React Testing Library
└── .github/workflows/  CI, Lighthouse and PR checks
```

## 🔑 Environment Variables

| Variable | Description | Required |
| :-- | :-- | :-- |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon or publishable key | Yes |
| `CONTACT_TO` | Address that receives contact submissions | Yes |
| `SMTP_HOST` | SMTP server host | Yes |
| `SMTP_PORT` | SMTP port (usually 587) | Yes |
| `SMTP_USER` | SMTP username or email | Yes |
| `SMTP_PASS` | SMTP password or app password | Yes |

## 📜 Scripts

```bash
npm run dev       # start the dev server
npm run build     # production build
npm run start     # start the production server
npm run lint      # run ESLint
npm run test      # Jest in watch mode
npm run test:ci   # Jest once, with coverage
```

## ☁️ Deployment

Deploy to Vercel: import the repository, add the environment variables above and deploy. Pushes to `main` deploy automatically through GitHub Actions.

## 📄 License

Released under the MIT License.

<div align="center">

Built by **Mouaz Naji** · [GitHub](https://github.com/Mouaz7) · [Beacons](https://beacons.ai/mouaz98)

</div>
