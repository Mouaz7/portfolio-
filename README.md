<div align="center">

# Mouaz Naji · Developer Portfolio

A full stack developer portfolio with a **git themed identity** — the career page reads like a real `git log graph`, the projects page is a live **GitHub repositories** clone, and the contact form is a **GitHub New Issue** editor. It ships a **CV grounded AI assistant**, a **no scroll constellation home hero** and full **multilingual** support (English, Swedish, Arabic with RTL). Built on Next.js 15, React 19, TypeScript, Tailwind and Supabase.

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
| 🤖 **AI assistant** | A floating chatbot that answers questions about Mouaz, grounded on the real CV and live portfolio data — never makes facts up. Intent routing, prompt injection guard, language matching and analytics logging. |
| ⏳ **Loading** | A tiny terminal window that runs `git pull` while data fetches. |

Everything sits on one shared, interactive **living constellation** backdrop and a **database driven theme** (dark and light, cyan accent) so the look never breaks between pages.

## 🚀 Features

- **CV grounded AI assistant** — a chatbot at `/api/chat` that answers questions about Mouaz using only the real CV (`site_cv` table) and live portfolio knowledge (skills, projects, roadmap, contacts). It detects intent and answers common questions locally, falls back to an LLM (NVIDIA NIM) for the rest, guards against prompt injection, replies in the visitor's language, and logs unanswered questions to Supabase for review. Refuses to invent facts.
- **Multilingual (i18n)** — English, Swedish and Arabic, with full right to left layout for Arabic. The assistant also auto matches the language of each question.
- **No scroll constellation home hero** — a single fixed viewport hero with an animated gradient name, looping role cycler, magnetic buttons, count up stat metrics, an interactive `ParticleField` constellation, a live terminal console and a cycling featured project card. A dedicated mobile layout keeps it scroll free on every phone.
- **Living constellation backdrop** — a single interactive canvas of accent coloured nodes that drift, link when close and react to the pointer. Rendered once globally so every page shares it.
- **Database driven theme** — dark and light modes with the accent stored in Supabase and injected as CSS variables at request time. No flash, no redeploy to recolour.
- **Dynamic content** — skills, projects, roadmap, stats, the featured project card and the tech marquee all load live from Supabase. The projects page also merges in live data straight from the GitHub API.
- **Rich contact form** — email delivery through Nodemailer with attachments, validation and rate limiting.
- **CV download** — streamed from Supabase Storage. Swap the file in storage, no redeploy.
- **Responsive and accessible** — fluid sizing from phone to ultrawide, keyboard focus states and full reduced motion support.
- **SEO** — metadata, sitemap and robots.
- **Tested with CI** — Jest and React Testing Library (including chat routing and logging), with GitHub Actions for checks, Lighthouse and deployment.

## 🧱 Tech Stack

| Area | Tech |
| :-- | :-- |
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4, CSS variables |
| Animation | Framer Motion plus custom canvas and CSS |
| Backend | Supabase (PostgreSQL and Storage), Next.js route handlers |
| AI | NVIDIA NIM (OpenAI compatible) LLM, custom intent router and CV grounding |
| Live data | GitHub REST API (projects page) |
| Email | Nodemailer |
| i18n | Custom provider — English, Swedish, Arabic (RTL) |
| Tooling | ESLint, Jest, React Testing Library, GitHub Actions |

## 🗺️ Pages

| Route | Description |
| :-- | :-- |
| `/` | Home — no scroll constellation hero with kinetic name, role cycler, count up metrics, terminal console, tech marquee and a cycling featured project card. |
| `/skills` | Skills grouped by category, icons served from Supabase. |
| `/roadmap` | Career and education as a git graph timeline. |
| `/projects` | GitHub repositories view — live repos, search, category filters and sorting. |
| `/contact` | GitHub issue style contact form with a rich text editor and attachments. |

Key API route handlers live under `app/api/` — `chat` (AI assistant), `contact` (email), `cv` (CV stream), `skills`, `project`, `roadmap`, `ui-icons` and `health`.

All pages share the global header (wheel and swipe navigation), language switcher, theme toggle, constellation backdrop and the floating AI assistant.

## ⚡ Quick Start

### Prerequisites

- Node.js 20 or newer
- A Supabase project (PostgreSQL and Storage)
- SMTP credentials for the contact form (a Gmail app password works)
- Optional: an NVIDIA NIM API key to enable the AI assistant's LLM fallback (it still answers common questions without one)

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
# Optional — enables server-side chat analytics logging
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

CONTACT_TO=you@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password

# Optional — AI assistant LLM fallback
NVIDIA_API_KEY=your-nvidia-api-key
NVIDIA_MODEL=qwen/qwen3.5-397b-a17b
```

Set up the database and storage:

- Run the scripts in `supabase/` in the Supabase SQL editor to create the `skill`, `skill_category`, `project`, `roadmap_item`, `site_theme` and `ui_icon` tables, the `site_cv` table that grounds the AI assistant, plus the contact tables in `db/contact_social.sql`.
- Run `db/unanswered_chat_logs.sql` to create the table the assistant uses to log questions it could not answer.
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
│   ├── api/            route handlers: chat, contact, cv, skills, project, roadmap, ui-icons, health
│   ├── layout.tsx      root layout, global backdrop, i18n and database theme
│   ├── page.tsx        home (server) — fetches profile and featured projects, renders the hero
│   └── global.css      design tokens and theme variables
├── components/
│   ├── layout/         header, footer, theme toggle, backdrop, navigation
│   ├── i18n/           LanguageProvider and switcher (EN, SV, AR)
│   ├── ui/             loading animation (terminal style)
│   ├── home/           hero, cursor glow, magnetic buttons, role cycler, ParticleField, CountUp
│   ├── chat/           AiChatbot (the floating CV grounded assistant)
│   ├── roadmap/        GitGraphTimeline (the git log graph)
│   ├── projects/       GithubRepoRow (the repositories list)
│   └── contact/        ContactIssueForm (the new issue editor)
├── lib/
│   ├── chat/           AI assistant core (intent router, guards), knowledge, logging
│   ├── hooks/          live accent colour for the canvas
│   ├── supabase/       Supabase client
│   ├── contact/        mailer and validation
│   ├── cv.ts           CV text loader (site_cv table) that grounds the assistant
│   ├── featured.ts     featured projects for the home hero
│   └── theme.ts        database theme to CSS variables
├── db/                 contact tables and unanswered chat logs
├── supabase/           setup and seed scripts
├── public/             logo and assets
├── __tests__/          Jest and React Testing Library (incl. chat routing and logging)
└── .github/workflows/  CI, Lighthouse and PR checks
```

## 🔑 Environment Variables

| Variable | Description | Required |
| :-- | :-- | :-- |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon or publishable key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — enables server-side chat analytics logging | No |
| `CONTACT_TO` | Address that receives contact submissions | Yes |
| `CONTACT_SUBJECT` | Subject line for contact emails | No |
| `MAIL_FROM` | From header for contact emails | No |
| `SMTP_HOST` | SMTP server host | Yes |
| `SMTP_PORT` | SMTP port (usually 587) | Yes |
| `SMTP_USER` | SMTP username or email | Yes |
| `SMTP_PASS` | SMTP password or app password | Yes |
| `SMTP_SECURE` | `true` for SSL (port 465), `false` for STARTTLS (587) | No |
| `NVIDIA_API_KEY` | NVIDIA NIM API key — enables the assistant's LLM fallback | No |
| `NVIDIA_MODEL` | LLM model id (defaults to a Qwen model) | No |

## 📜 Scripts

```bash
npm run dev       # start the dev server
npm run build     # production build
npm run start     # start the production server
npm run lint      # run ESLint
npm run test          # Jest in watch mode
npm run test:ci       # Jest once, CI mode with coverage
npm run test:coverage # Jest with a coverage report
```

## ☁️ Deployment

Deploy to Vercel: import the repository, add the environment variables above and deploy. Pushes to `main` deploy automatically through GitHub Actions.

## 📄 License

Released under the MIT License.

<div align="center">

Built by **Mouaz Naji** · [GitHub](https://github.com/Mouaz7) · [Beacons](https://beacons.ai/mouaz98)

</div>
