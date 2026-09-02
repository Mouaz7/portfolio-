# Deployment

This app can deploy to Vercel, Netlify, or a self-hosted Node server. All targets need the same Supabase and SMTP environment variables.

## Required Environment

Use `.env.example` as the source of truth.

Minimum production variables:

```bash
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
CONTACT_TO=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
RATE_LIMIT_PEPPER=
SESSION_COOKIE_SECRET=
CRON_SECRET=
RAG_JOB_SECRET=
REVALIDATE_SECRET=
CV_STORAGE_BUCKET=private-cv
CV_STORAGE_OBJECT=cv/Mouaz-Naji-CV-2026-08.pdf
```

The five security/automation secrets must be independently generated, unique, non-placeholder values of at least 32 UTF-8 bytes. The central server-only validator runs when sensitive server modules initialize and is reused by health checks; failures expose variable names and error types, never values.

## AI Key Security

AI requests already run through Next.js server routes:

- `/api/ai/cv-chat`
- `/api/ai/code-review`
- `/api/ai/code-review/chat`

NVIDIA keys stay in server environment variables and are never sent to browser code. On Vercel, add them under Project Settings > Environment Variables. Do not use `NEXT_PUBLIC_` for AI keys. Rotate keys pasted into chat, logs, screenshots, or commits.

Code submitted to the review tools is sent to the configured NVIDIA chat endpoint. Portfolio chatbot retrieval sends source chunks, including configured CV content, to the NVIDIA embedding endpoint during reindexing and sends only the retrieved context to the chat endpoint when answering. Changing `NVIDIA_EMBEDDING_MODEL` requires a protected RAG reindex; the model ID is included in the source hash so the next run rebuilds all vectors consistently.

Free NVIDIA endpoints still have quotas and rate limits. For higher traffic, add provider-side rate limiting or an authenticated gateway before exposing these routes publicly.

## Vercel

Vercel is the main deployment path and is connected directly to this GitHub repository.

1. Import the GitHub repo into Vercel.
2. Add environment variables in Vercel project settings.
3. Link the GitHub repository through Vercel's Git integration.
4. Push to `main` after Quality and CodeQL pass.

Vercel's Git integration creates production deployments for pushes to `main` and preview deployments for pull requests. GitHub Actions independently runs the full quality gate; branch protection should require that check before pull requests are merged.

Official reference: https://vercel.com/docs/frameworks/full-stack/nextjs

## Netlify

Use Netlify when you want Git-based deploy previews but keep the app as a normal Next.js server app.

Recommended settings:

```text
Build command: npm run build
Install command: npm ci
```

Add the same Supabase and SMTP variables in Netlify site settings. Do not convert this project to static export unless you also replace API routes, CV download, and contact email behavior.

Official references:

- https://docs.netlify.com/build/configure-builds/overview/
- https://docs.netlify.com/deploy/create-deploys/

## Self-Hosted Node

Build and run the app with Node 22+:

```bash
npm ci
npm run build
npm run start
```

Run it behind a reverse proxy such as Nginx, Caddy, or a platform load balancer. Set production environment variables before `npm run start`.

Vercel and Netlify use their canonical client-IP headers automatically. For another trusted reverse proxy, set `TRUSTED_PROXY_IP_HEADER` only when that proxy strips incoming copies and writes the selected header itself.

Official reference: https://nextjs.org/docs/app/guides/self-hosting

## Pre-Deploy Checks

```bash
npm run test:ci
npm run check:dead
npm run test:design-lock
npm run build
```

Also verify:

- `/api/health` returns `{ "ok": true }`.
- `/api/internal/health` rejects unauthenticated requests and performs the protected Supabase check with a valid CRON bearer token.
- `/api/cv` serves the configured private versioned object, emits ETag and Last-Modified, and returns `304` for matching validators.
- `/contact-page` can submit with your SMTP provider.

## Vercel WAF rollout

Create route-specific rate limits in log mode first, inspect production traffic,
then enforce with HTTP 429:

| Route | Limit |
| --- | ---: |
| `/api/ai/*` | 20 requests/minute/IP |
| `/api/contact/prepare`, `/api/contact/send` | 10 requests/minute/IP |
| `/api/github/repo-stats` | 30 requests/minute/IP |
| `/api/health`, `/api/internal/health` | 60 requests/minute/IP |

Do not guess or overwrite existing Vercel settings. Apply these only from the
verified linked project and confirm the logs before changing from log mode.
