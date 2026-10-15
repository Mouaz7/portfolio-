# Mouaz Naji — Developer Portfolio

A personal portfolio for Mouaz Naji, presented as a Git-inspired developer
workspace. It brings together projects, experience, skills, and ways to get in
touch in a responsive interface.

[View the live portfolio](https://mouazdev.vercel.app)

## Explore

- **[Home](https://mouazdev.vercel.app/):** Profile, selected work, and CV access.
- **[Skills](https://mouazdev.vercel.app/skills):** Technologies presented as
  connected repository cards.
- **[Journey](https://mouazdev.vercel.app/journey):** Education and experience
  shown as a chronological Git graph.
- **[Projects](https://mouazdev.vercel.app/projects):** Searchable projects with
  filters and GitHub repository details.
- **[Code Review](https://mouazdev.vercel.app/code-review):** AI-assisted code
  review and a portfolio-aware assistant.
- **[Contact](https://mouazdev.vercel.app/contact):** A repository-inspired
  contact form.

The site is available in English, Swedish, and Arabic. It is built with
Next.js, React, TypeScript, and Supabase.

## Run locally

You need Node.js 22.x and npm. A Supabase project is needed for data-backed
features; other integrations use the credentials described in
[`.env.example`](.env.example).

```bash
git clone git@github.com:Mouaz7/portfolio-.git
cd portfolio-
npm ci
cp .env.example .env.local
```

Fill in the environment values needed for the features you want to use, then
start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) once the terminal reports
`Public pages ready`. Keep credentials out of version control.

## Common commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript |
| `npm run test:ci` | Run Jest with coverage |
| `npm run test:e2e` | Run Playwright tests |

The [testing guide](docs/testing-guide.md) covers browser setup and additional
checks.

## More information

- [Documentation hub](docs/README.md) — architecture, features, setup, and
  deployment guides.
- [Security policy](.github/SECURITY.md) — responsible disclosure.
- [Privacy notice](https://mouazdev.vercel.app/privacy) — how site data is
  handled.

## License

Copyright © 2026 Mouaz Naji. All rights reserved. See the
[license](LICENSE) and [asset rights](ASSETS_LICENSE.md) before reusing any
code or assets.
