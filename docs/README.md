# 📚 Documentation Hub

Short path through project docs. Start here, move to deep guide you need, skip noise.

<p align="center">━━━━━━━━━━━━━━ 🧭 ━━━━━━━━━━━━━━</p>

## Start Here

| First stop | Why |
| --- | --- |
| [Features](features.md) | Best overview of what site actually does. |
| [Architecture](architecture.md) | Best map of app structure and data flow. |
| [Database](database.md) | Supabase tables, pgvector RAG, and storage setup. |
| [Deployment](deployment.md) | Best launch path for Vercel, Netlify, or self-hosted. |

## Quick Setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Checks before push:

```bash
npm run test:ci
npx tsc --noEmit
npm run build
```

## Guides

<table>
  <tr>
    <td align="center" width="33%">
      <strong><a href="architecture.md">🏗️ Architecture</a></strong><br />
      App Router shape, API layers, shared patterns.
    </td>
    <td align="center" width="33%">
      <strong><a href="database.md">🗄️ Database</a></strong><br />
      Supabase tables, pgvector RAG, storage buckets, migration reality.
    </td>
    <td align="center" width="33%">
      <strong><a href="features.md">✨ Features</a></strong><br />
      Pages, APIs, and feature-level behavior.
    </td>
  </tr>
  <tr>
    <td align="center" width="33%">
      <strong><a href="styling.md">🎨 Styling</a></strong><br />
      Theme tokens, motion, responsive layout rules.
    </td>
    <td align="center" width="33%">
      <strong><a href="deployment.md">🚀 Deployment</a></strong><br />
      Vercel, Netlify, and self-hosted rollout.
    </td>
    <td align="center" width="33%">
      <strong><a href="cv-setup.md">📄 CV Setup</a></strong><br />
      Storage bucket path and verification flow.
    </td>
  </tr>
  <tr>
    <td align="center" width="33%">
      <strong><a href="cicd-pipeline.md">🔁 CI/CD Pipeline</a></strong><br />
      GitHub Actions jobs, secrets, and checks.
    </td>
    <td align="center" width="33%">
      <strong><a href="testing-guide.md">🧪 Testing Guide</a></strong><br />
      Jest setup, patterns, and pre-PR checks.
    </td>
    <td align="center" width="33%">
      <strong><a href="../README.md">🌊 Root README</a></strong><br />
      Visual project entry and quick overview.
    </td>
  </tr>
</table>

## Read By Goal

| Goal | Read next |
| --- | --- |
| Understand app quickly | [Features](features.md) → [Architecture](architecture.md) |
| Hook up Supabase correctly | [Database](database.md) → [CV Setup](cv-setup.md) |
| Configure AI tools | [Database](database.md) → [Features](features.md) |
| Ship to production | [Deployment](deployment.md) → [CI/CD Pipeline](cicd-pipeline.md) |
| Work safely in repo | [Testing Guide](testing-guide.md) → [Root README](../README.md) |

## Back

- [Return to root README](../README.md)
