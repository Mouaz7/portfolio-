# CI/CD Pipeline

The repository has four GitHub Actions workflows under `.github/workflows` and uses Node 22 for application quality checks.

## Quality and deployment

`ci-cd.yml` runs for pushes and pull requests targeting `main`. One concurrency group cancels superseded runs for the same ref.

The `quality` job performs, in order:

1. deterministic `npm ci` installation;
2. production and complete dependency audits;
3. lint, TypeScript, dead-code, and design-lock checks;
4. Jest coverage;
5. a clean Supabase reset and SQL policy tests;
6. a production build;
7. Playwright browser, accessibility, and pixel-lock checks;
8. Lighthouse CI with actual Chromium (`provided` throttling), three runs per route, and median gates: performance ≥0.80, LCP ≤2.5 s, TBT ≤250 ms, and CLS ≤0.05;
9. `git diff --check`.

The Lighthouse CLI version and GitHub Actions are pinned to reviewed versions. Browser, pixel, Playwright, coverage, and Lighthouse reports are retained as private workflow artifacts for seven days.

The production build receives five independent random CI-only values for the central secret validator. Performance 0.85 and later 0.90 are future ratchets, not blockers for this delivery.

Vercel's Git integration owns deployments: pushes to `main` create production deployments and pull requests create previews. The workflow does not duplicate deployments or store a Vercel access token in GitHub Actions. Protect `main` with the quality job as a required status check so pull requests cannot merge before validation succeeds.

## Pull request conventions

`pr-checks.yml` validates semantic PR titles and reports the changed-file and addition counts. It has short per-job timeouts and cancels stale runs for the same pull request.

## Project synchronization

`sync-projects.yml` runs daily and can also be dispatched manually. It synchronizes public GitHub projects to Supabase, revalidates the project cache, and refreshes the RAG index. Its concurrency group prevents two database synchronization jobs from running together.

The public production origin is stored once as the non-sensitive repository variable `CANONICAL_SITE_URL`. The synchronization script and both protected follow-up requests derive their URLs from that value. `REVALIDATE_SECRET` and `RAG_JOB_SECRET` are repository secrets synchronized with their separately scoped Vercel Production values.

## Required secrets

The workflows use Supabase, rate-limit, cache-revalidation, and RAG-job secrets. Vercel keeps deployment variables in the linked project. Public URLs belong in repository variables, not secrets. `.env.example` is the maintained variable reference; real `.env*` files are ignored by Git.

## Code scanning and dependency updates

`codeql.yml` is registered for `main`, pull requests, and a weekly schedule. The analysis job stays skipped while the repository is private because CodeQL upload requires eligible private-repository GitHub Code Security; it runs automatically once repository metadata reports public visibility. CodeQL actions are pinned to one reviewed full commit SHA. Dependency updates are reviewed and applied manually, with major upgrades treated as explicit compatibility projects. Repository rules should require Quality and a genuinely green CodeQL run only after the repository is public, and should then block force-push and branch deletion.
