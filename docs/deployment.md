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
CV_STORAGE_OBJECT="cv/Cv .pdf"
```

The five security/automation secrets must be independently generated, unique, non-placeholder values of at least 32 UTF-8 bytes. The central server-only validator runs when sensitive server modules initialize and is reused by health checks; failures expose variable names and error types, never values.

## AI Key Security

AI requests already run through Next.js server routes:

- `/api/ai/cv-chat`
- `/api/ai/code-review`
- `/api/ai/code-review/chat`

NVIDIA-compatible API keys stay in server environment variables and are never sent to browser code. On Vercel, add them under Project Settings > Environment Variables. Do not use `NEXT_PUBLIC_` for AI keys. Treat any credential found in Git, logs, screenshots, chats, or another verified exposure surface as compromised; revoke it before installing a fresh replacement.

Code submitted to the review tools is sent to the configured NVIDIA chat endpoint. Portfolio chatbot retrieval sends source chunks, including configured CV content, to the NVIDIA embedding endpoint during reindexing and sends only the retrieved context to the chat endpoint when answering. Changing `NVIDIA_EMBEDDING_MODEL` requires a protected RAG reindex; the model ID is included in the source hash so the next run rebuilds all vectors consistently.

Free NVIDIA endpoints still have quotas and rate limits. For higher traffic, add provider-side rate limiting or an authenticated gateway before exposing these routes publicly.

## Vercel

Vercel is the main deployment path and is connected directly to this GitHub repository.

1. Import the GitHub repo into Vercel.
2. Add environment variables in Vercel project settings.
3. Link the GitHub repository through Vercel's Git integration.
4. Merge an approved pull request to `main` only after Quality, the independent pgTAP job, visual review and exact-commit preview pass. Do not push directly to `main`. Require CodeQL on the pull request only when repository visibility, licensing and GitHub configuration make it available; this release also requires separate owner approval before merge.

Vercel's Git integration creates production deployments for updates to `main` and preview deployments for pull requests. GitHub Actions runs Quality and isolated pgTAP separately. Branch protection should require the verified check names before pull requests are merged; the present `main` protection does not yet require these checks.

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

For background/loading changes, also run the lifecycle and cross-browser suites, the existing pixel lock, Lighthouse and the motion-enabled before/after performance comparison described in `testing-guide.md`. Keep screenshot references unchanged unless an intentional visual change has been approved. Create a PR, wait for Quality (and CodeQL when it is genuinely available), and verify its Vercel preview before merging. Production is created by the existing Git integration; verify the deployed commit and public routes afterward without sending contact emails. Keep the previous successful deployment available for rollback.

### Historical local validation (2026-09-19)

The results in this section describe the 2026-09-19 candidate, not the current uncommitted working tree or an approved release. Re-run all gates against the exact commit proposed for deployment.

The low-power Skills entrance change has passed a local production build,
132/132 Chromium/Firefox/WebKit browser tests, five navigation clicks per
destination, 18/18 Lighthouse lab runs and a four-core/4 GB motion run. Skills
measured 3,100 ms LCP/437 ms blocking/0 CLS in that motion run, versus an older
same-profile pre-fix observation of 3,624 ms/583 ms/0 CLS. This is not a
controlled same-run comparison, a passing production Core Web Vital, or a
deployed-preview result. Lighthouse uses a static performance-audit background
for Skills, so its score does not replace the normal-motion measurement.

The change is **not release-verified**: 24/36 pixel comparisons (all six Skills
references pass) and three design-lock files require manual visual review.
Intermittently clipped low-tier card content in headless Chromium screenshots
needs a physical-device and deployed-preview check. The artifact also appeared with the original card
animation, so its cause and real-device impact are not established. Do not
replace approved screenshot images or hashes automatically. The protected-main
history rewrite and fresh remote scan are complete. Isolated pgTAP passed on
validation SHA `efcc12d5a95cedeb9a417f2e5d57e4b642a7028a`, but Quality
still fails design-lock and credential/licence approvals and the other release
gates in `implementation-status.md` remain blockers.

The connected Vercel account returned 403 when listing this project's
deployments on 2026-09-19 and listed no accessible teams. GitHub also denied
creation of the validation PR despite the authenticated owner account showing
Admin access; no exact-commit preview is verified. Do not treat an access error
as a failed preview test or deploy the unreviewed working tree to compensate.
The intended access and a reviewed candidate PR's exact preview URL and commit
SHA must be verified before remote release checks proceed. An older deployment
cannot verify the candidate branch.

### Current local checklist

```bash
npm run test:ci
npm run check:dead
npm run test:design-lock
npm run lint
npm run typecheck
npm run build
```

Also verify:

- `/api/health` returns `{ "ok": true }`.
- `/api/internal/health` rejects unauthenticated requests and performs the protected Supabase check with a valid CRON bearer token.
- `/api/cv` serves the configured private object, emits ETag and Last-Modified, and returns `304` for matching validators.
- `/contact` can submit with your SMTP provider.

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
