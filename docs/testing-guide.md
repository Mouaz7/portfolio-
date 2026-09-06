# Testing Guide

Tests use Jest, React Testing Library, and `jest-environment-jsdom`.

## Commands

```bash
npm run test:ci
npm run test:coverage
```

`npm run test` starts Jest in watch mode.

## Setup Files

| File | Purpose |
| --- | --- |
| `jest.config.js` | Next/Jest integration, path aliases, coverage collection. |
| `jest.setup.js` | Test environment variables and browser mocks. |
| `__tests__/` | Component, API, utility, and environment tests. |

## Test Environment

`jest.setup.js` provides test defaults for:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `CONTACT_TO`
- browser APIs used by responsive and animated components

This keeps tests from requiring real production secrets.

## What To Test

| Area | Good checks |
| --- | --- |
| Components | Render states, labels, navigation, responsive behavior. |
| API routes | Success shape, validation failures, missing backend errors. |
| Utilities | Pure mapping logic, validation, graph derivation. |
| Environment | Required variable detection and safe defaults. |

## Patterns

- Prefer accessible queries such as `getByRole` and `getByLabelText`.
- Mock network calls close to the component that owns them.
- Keep Supabase and SMTP calls out of unit tests unless explicitly mocked.
- Test pure helpers directly. `lib/journey/deriveGitGraph.ts` is a good example.

## Before Opening a PR

```bash
npm run test:ci
npx tsc --noEmit
npm run build
```

Run `npm run lint` to check the configured ESLint rules.

## Browser Layout Matrix

`tests/e2e/public-pages.spec.ts` protects the responsive layout with Playwright:

- compact laptops: 800×600, 900×600, 1024×600, 1024×768, 1280×720, 1366×768;
- portrait tablets and foldables: 712×1138, 768×1024, 853×1280, 912×1368, 960×1440, 1032×1376;
- compact display: 1280×800;
- wide displays: 1920×1080, 2560×1440, 3440×1440, 3840×2160;
- browser-zoom equivalents: 853 px at 150%, 640 px at 200%, and 320 px reflow at 400%.

The matrix checks horizontal overflow, bounded and centered ultrawide content, light/dark theme stability, compact-header switching, accessible contact-form validation focus, and Windows High Contrast (`forced-colors`) focus visibility.
## Loading and background regression checks

Server-provided Skills, Journey and Projects data (including empty arrays) must render without a page loader or duplicate primary-data request. Code Review has no initial data dependency and renders immediately. Client fallback requests show the existing loader only while pending; Skills waits for both categories and skills. No minimum-duration loading timer is used.

AI requests, contact submission and CV download retain their real pending states. Request-abort timeouts, success-message timers and visual animation timers do not impose a minimum loading duration.

The background regression checks include touch laptops at 1366×768 and a simulated four-core desktop. These retain the desktop shader; the constrained profile uses a lower backing resolution and 30 FPS. Phone profiles retain their existing shader. Background measurements in headless Chromium do not establish behavior on every physical GPU.

Background lifecycle tests cover live reduced-motion changes, profile changes in both directions, actual main-thread WebGL context loss/restoration and worker startup timeout with late-message rejection. Workers have a five-second startup/recovery deadline; failures release worker listeners and retain the themed CSS fallback. Motion and visibility listeners remain available for that fallback until unmount. Firefox/WebKit run the targeted compatibility suite; the full visual baseline remains Chromium-specific.

Skills retains its 900 ms animation and 120 ms card staggering. Memoized cards avoid unrelated rerenders, and opacity/filter animation hints are released on completion, cancellation or motion-setting changes. The transform hint remains: removing it changes Chromium text rasterization inside the viewport-scaled stage, as confirmed against unchanged main. Preserving this layer is a deliberate exception to releasing every hint, to preserve the locked design. The intentional visual entrance is separate from data loading.

Run `PERF_BASE_URL=http://127.0.0.1:3000 npm run test:motion-performance` against a production server. It measures Home, Skills and Code Review three times with motion enabled, 4× CPU slowdown, 150 ms latency and 1.6 Mbit/s download throughput. Reports include LCP, observed layout shifts, long tasks, excess long-task duration and frame intervals; the blocking metric covers the full observation window and is not Lighthouse TBT. Store a before report using `PERF_OUTPUT`, then pass it as `PERF_BASELINE` for comparison on the same machine and data. The comparison fails when the median LCP/blocking increase exceeds both 15% and 100 ms and all three candidate values are worse than all three baseline values. Overlapping three-run ranges are reported as inconclusive runner noise rather than a regression. Median CLS must remain at or below 0.05. Reports are stored outside Playwright's cleared output directory in `.performance-results/`.

Physical Windows scaling (125–150%), native browser zoom and vendor-specific GPU behavior require a Windows/device check. CSS viewport emulation and CPU throttling are not substitutes for those checks. A friend-device visual discrepancy is not considered reproduced solely by these emulations.

CI builds the unchanged PR base (or previous main commit) in `.motion-baseline/`, then measures baseline and candidate sequentially on the same runner against the same isolated test data. Both reports are retained. `PERF_SERVER_ROOT` selects an already-built baseline when using `node scripts/run-motion-ci.mjs` locally; it does not change which measurement script runs.

### Pixel-reference audit

An independently built worktree of unchanged `c3a7941` reproduced 14 failing references: ten tablet screenshots (earlier navigation changes) and four desktop Contact/Projects screenshots. Those references were reconciled from unchanged main, not candidate screenshots. Existing comparison algorithms and tolerances were retained. Desktop-light and tablet-dark Skills use the existing four-bit geometry allowance with signatures from unchanged main (each candidate differs by one bit through subpixel rasterization). The Skills transform hint is retained specifically to avoid accepting an implementation-induced text-rendering change.

The first Projects card has one independently fetched repository-statistics row. CI's isolated data can show its deterministic language/zero counts while a local run may capture live GitHub language/star/fork values. Pixel normalization masks only that 154×24 px metadata line at its desktop/tablet positions; project titles, descriptions, badges, cards and surrounding geometry remain locked.

Local three-run comparison against `c3a7941` on 2026-09-06 (same machine, data and constrained profile): Home median LCP 1516 → 1520 ms, Skills 2792 → 1824 ms, Code Review 2276 → 620 ms. Median excess long-task durations were 154 → 140 ms, 248 → 292 ms and 103 → 196 ms respectively. All passed the combined relative/absolute regression gate; CLS remained below 0.05. These are measurements from this environment, not promises for every device.
