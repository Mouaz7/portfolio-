<div align="center">

<img src="public/brand/mouaz%2Dlogo.svg" width="72" alt="Mouaz Naji logo" />

# Mouaz Naji

### Developer Portfolio

Projects, skills and experience in an interactive developer workspace.

**[View portfolio](https://mouazdev.vercel.app) · [Documentation](docs/README.md) · [Contact](https://mouazdev.vercel.app/contact)**

English · Swedish · Arabic

</div>

## Inside the portfolio

A responsive personal portfolio built with Next.js, React, TypeScript and
Supabase. Explore the site in light or dark mode, on desktop, tablet or phone.

<table>
<tr><th>Page</th><th>What you can explore</th></tr>
<tr>
<td><strong>Home</strong></td>
<td>Profile, selected work and CV access.</td>
</tr>
<tr>
<td><strong>Skills</strong></td>
<td>Technologies arranged as connected repository cards.</td>
</tr>
<tr>
<td><strong>Journey</strong></td>
<td>Education and experience along a chronological Git graph.</td>
</tr>
<tr>
<td><strong>Projects</strong></td>
<td>Search, category filters and GitHub repository details.</td>
</tr>
<tr>
<td><strong>Contact</strong></td>
<td>A contact form presented as a repository workflow.</td>
</tr>
</table>

## Start locally

Use **Node.js 22.x** and npm. Open the project directory, then run:

```bash
npm ci
cp .env.example .env.local
```

Configure the values in [`.env.example`](.env.example). A Supabase project is
required for database features. AI, email and other integrations need their
own credentials. Keep real credentials in your local environment file.

```bash
npm run dev
```

Open **[localhost:3000](http://localhost:3000)** when the terminal reports
`Public pages ready`.

## Everyday commands

<table>
<tr><th>Command</th><th>Purpose</th></tr>
<tr><td><code>npm run dev</code></td><td>Start development</td></tr>
<tr><td><code>npm run build</code></td><td>Create a production build</td></tr>
<tr><td><code>npm start</code></td><td>Serve the production build</td></tr>
<tr><td><code>npm run lint</code></td><td>Check code style</td></tr>
<tr><td><code>npm run typecheck</code></td><td>Check TypeScript</td></tr>
<tr><td><code>npm run test:ci</code></td><td>Run unit tests with coverage</td></tr>
<tr><td><code>npm run test:e2e</code></td><td>Run browser tests</td></tr>
</table>

Browser installation and additional checks are explained in the
[testing guide](docs/testing%2Dguide.md).

## Documentation and policies

**[Documentation hub](docs/README.md)** covers setup, features, architecture
and deployment.

**[Security policy](.github/SECURITY.md)** explains how to report a vulnerability.

**[Privacy notice](https://mouazdev.vercel.app/privacy)** describes site data use.

## Rights

Copyright © 2026 Mouaz Naji. All rights reserved.

Read the [license](LICENSE) and [asset rights](ASSETS_LICENSE.md) before
reusing code or assets.
