# CI/CD Pipeline

The repository has four GitHub Actions workflows under `.github/workflows` and uses Node 22 for application quality checks.

## Quality and deployment

`ci-cd.yml` runs for pushes and pull requests targeting `main`. One concurrency group cancels superseded runs for the same ref.

The independent `database` job resets an isolated Supabase database and runs the SQL policy tests. The `quality` job performs, in order:

1. deterministic `npm ci` installation;
2. production and complete dependency audits;
3. full reachable-history scanning with pinned Gitleaks and the complementary project-specific scanner;
4. dependency-license inventory;
5. lint, TypeScript, dead-code, and design-lock checks;
6. Jest coverage;
7. a production build;
8. Playwright browser, accessibility, and pixel-lock checks;
9. Lighthouse CI with actual Chromium (`provided` throttling), three runs per route, and median gates: performance ≥0.80, LCP ≤2.5 s, TBT ≤250 ms, and CLS ≤0.05;
10. a same-run motion comparison against the base commit;
11. `git diff --check`.

Lighthouse stores normal-motion results for Home, Skills, Projects and Contact separately from the existing reduced-motion Journey diagnostic. Journey produces no qualified mobile LCP under normal animation; its normal desktop LCP is checked by the motion script. The assertion thresholds remain unchanged. Historical motion baselines receive disposable missing security values only inside their own build/server subprocesses.

The Lighthouse CLI version and GitHub Actions are pinned to reviewed versions. Browser, pixel, Playwright, coverage, and Lighthouse reports are retained as private workflow artifacts for seven days.

The production build receives four independent random CI-only values for the central secret validator. Performance 0.85 and later 0.90 are future ratchets, not blockers for this delivery.

Vercel's Git integration owns deployments: pushes to `main` create production deployments and pull requests create previews. The workflow does not duplicate deployments or store a Vercel access token in GitHub Actions. Protect `main` with the quality job as a required status check so pull requests cannot merge before validation succeeds.

## Pull request conventions

`pr-checks.yml` validates semantic PR titles and reports the changed-file and addition counts. It has short per-job timeouts and cancels stale runs for the same pull request.

## Project synchronization

`sync-projects.yml` is intentionally paused as a scheduled job and can be dispatched manually. It reports two jobs separately: Projects sync and project-cache revalidation. Revalidation depends on a successful sync and uses its own secret. Its concurrency group prevents two synchronization runs from overlapping.

Immediately before configuring the workflow, inventory the environment variables read by each workflow step and each invoked program. That inventory is the normative mapping. In the current code, the sync step reads Supabase configuration and the canonical site URL, while the protected revalidation step reads its own bearer secret and URL. Each job validates only names and never prints values.

## Required secrets

The workflows use Supabase, rate-limit, and cache-revalidation secrets. Vercel keeps deployment variables in the linked project. Public URLs belong in repository variables, not secrets. `.env.example` is the maintained variable reference; real `.env*` files are ignored by Git.

## Code scanning and dependency updates

`codeql.yml` is an advanced-workflow candidate registered for `main`, pull requests, and a weekly schedule. Before treating it as the intended configuration, verify both the workflow and GitHub Code Security settings. The analysis job stays skipped while the repository is private because CodeQL upload requires eligible private-repository GitHub Code Security; it runs automatically once repository metadata reports public visibility. CodeQL actions are pinned to one reviewed full commit SHA.

After publication, keep exactly one CodeQL setup: disable GitHub Default setup when the reviewed advanced workflow is selected, then confirm one JavaScript/TypeScript analysis per commit. Read the exact Quality and CodeQL check names from their first successful public run and prove them with a test pull request before locking the `main` ruleset. Dependency updates are reviewed and applied manually, with major upgrades treated as explicit compatibility projects.
