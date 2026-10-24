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

## Dependency Overrides

The development-tool overrides replace Next ESLint's `fast-glob` dependency with `tinyglobby`, preserving its `globSync`/`onlyDirectories` API while removing the unpatched `braces` chain (GHSA-vfj7-8cjw-p6xm). The NYC config loader uses `js-yaml` 4.3.2 through its existing `load` API, removing the legacy `argparse`/`sprintf-js` chain. Tooling compatibility tests cover both overrides.

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
- short and split-screen desktop windows: the reported Windows viewport at 1723×608 plus 1723×450, 1366×500/600, 1024×550, and 800×450;
- portrait tablets and foldables: 712×1138, 768×1024, 853×1280, 912×1368, 960×1440, 1032×1376;
- compact display: 1280×800;
- wide displays: 1920×1080, 2560×1440, 3440×1440, 3840×2160;
- browser-zoom equivalents: 853 px at 150%, 640 px at 200%, and 320 px reflow at 400%.

The matrix checks horizontal and document-height overflow, bounded and centered ultrawide content, light/dark theme stability, compact-header switching, accessible contact-form validation focus, and Windows High Contrast (`forced-colors`) focus visibility. Short-window checks assert that every page root remains inside the viewport, every Skills and Journey card remains inside its fitted stage, Projects keeps its intentional internal panels reachable, and Contact shows its portrait, send control, command strip, copyright, and logo without document scrolling. A live-resize regression changes Contact from `fit` to `accessible-overflow` and back without reloading. The 1366×600 short-window path is exercised in Chromium, Firefox, and WebKit. QHD, ultrawide and 4K surfaces must occupy at least 65% of the CSS viewport, and paired DPR 1/DPR 2 checks confirm that physical pixel density does not alter CSS geometry.

Large-display density profiles require both substantial width and height. They activate at 2200×1000 CSS pixels and step up again at 3200×1400. This keeps QHD/4K monitors at 100% scaling readable while a 4K monitor at 200% scaling (roughly a 1920 CSS-pixel viewport) correctly receives the standard desktop composition.

Skills has explicit large-display assertions in addition to the shared matrix. The wide, extra-wide, and ultra-wide profiles require progressively larger cards and square icon canvases at 1440, 1920, 2560, and 3840 px, while the phone/tablet checks keep every icon canvas equal, clipped, interactive, and free from horizontal overflow.

## Loading and background regression checks

Server-provided Skills, Journey and Projects data (including empty arrays) must render without a page loader or duplicate primary-data request. Client fallback requests show the existing loader only while pending; Skills waits for both categories and skills. No minimum-duration loading timer is used.

Contact submission and CV download retain their real pending states. Request-abort timeouts, success-message timers and visual animation timers do not impose a minimum loading duration.

The background regression checks include touch laptops at 1366×768 and a simulated four-core desktop. Worker-capable constrained desktops retain the desktop shader at a lower backing resolution and 30 FPS; if a constrained desktop must render on the main thread it uses the lighter analytic shader. Phone profiles retain their existing shader. Background measurements in headless Chromium do not establish behavior on every physical GPU.

Background lifecycle tests cover live reduced-motion changes, profile changes in both directions, actual main-thread WebGL context loss/restoration and worker startup timeout with late-message rejection. Workers have a five-second startup/recovery deadline; failures release worker listeners and retain the themed CSS fallback. Motion and visibility listeners remain available for that fallback until unmount. Firefox/WebKit run the targeted compatibility suite; the full visual baseline remains Chromium-specific.

Skills retains its 900 ms animation and 120 ms card staggering on standard devices. Memoized cards avoid unrelated rerenders, and opacity/filter animation hints are released on completion, cancellation or motion-setting changes. Low-memory, four-core and data-saver profiles render the final layout immediately while suppressing animated blur: profiling confirmed that a delayed transform kept an ordinary card description out of the LCP candidate set until the entrance finished. The static card background and backdrop blur are unchanged. Low-power cards retain an identity transform because removing the compositing layer clipped text and icons inside the viewport-scaled stage in Chromium. Animated standard-device cards retain their transform hint for the same rasterization reason. The intentional visual entrance is separate from data loading.

Protected interactive requests must also terminate predictably: Turnstile script loading stops after eight seconds, and an invisible challenge stops after ten seconds. Tests must prove that these paths restore the button from its pending state instead of leaving an indefinite loader.

Run `PERF_BASE_URL=http://127.0.0.1:3000 npm run test:motion-performance` against a production server. It measures the canonical Home and Skills routes three times with motion enabled, 4× CPU slowdown, four-core/4 GB browser hints, 150 ms latency and 1.6 Mbit/s download throughput. The matching hardware hints are important: DevTools CPU throttling does not change `hardwareConcurrency` or `deviceMemory`, so omitting them would exercise the standard-power UI path while calling the result a constrained-device measurement. Reports include LCP, observed layout shifts, long tasks, excess long-task duration and frame intervals; the blocking metric covers the full observation window and is not Lighthouse TBT. Store a before report using `PERF_OUTPUT`, then pass it as `PERF_BASELINE` for comparison on the same machine and data. The comparison fails when the median LCP/blocking increase exceeds both 15% and 100 ms and all three candidate values are worse than all three baseline values. Overlapping three-run ranges are reported as inconclusive runner noise rather than a regression. Median CLS must remain at or below 0.05. Reports are stored outside Playwright's cleared output directory in `.performance-results/`.

The motion report also identifies the final LCP element and its header/main region, the first visible Skills grid frame, and encoded document/script/style/image resource sizes. `PERF_VIEWPORT=390x844 PERF_MOBILE=1` selects the mobile profile; compare reports with identical profile settings. Grid visibility uses the same 15%/100 ms regression thresholds and non-overlapping-run rule as LCP/blocking. Total emitted build JavaScript is distinct from the bytes transferred for one page.

Removing a large header label can change the winning LCP element without delaying page content. The relative LCP gate treats that narrow case as non-comparable only when the baseline header winner is stable and the new main-content winners have the same tag, class and positive area. Equal-area skill SVGs may alternate as the winner. Every candidate grid must appear earlier than every baseline grid, the grid median must improve by more than 15% and 100 ms, and every candidate LCP run must be at most 2,500 ms. It emits an explicit warning; blocking, grid and CLS gates remain enforced. Other LCP regressions retain the existing thresholds. Unit tests reproduce the CI measurements and verify that unrelated LCP, blocking, grid and CLS regressions still fail.

The CI baseline wrapper discovers the historical checkout's own security-secret names and supplies missing disposable values only to its build/server subprocesses. This lets older revisions build after configuration requirements have been retired, without restoring those settings to the current application or global CI environment. No secret values are logged.

Lighthouse audits the canonical Home, Skills, Projects and Contact routes with normal motion. Journey retains its existing reduced-motion diagnostic in a separately named report: its animated mobile graph produces `NO_LCP` in Lighthouse despite visible content. The separate normal-motion desktop measurement still requires an actual Journey LCP. All Lighthouse assertion thresholds are unchanged. The `audit=performance` mode remains a separate animation-suppressed diagnostic and must not stand in for normal page loading. `skills-first-paint.spec.ts` holds application scripts while streamed HTML and CSS render, compares pre-hydration geometry with the measured layout, and checks the hidden fallback in browsers without the required CSS support. It runs in Chromium, Firefox and WebKit, including Arabic RTL and short-phone overflow.

Physical Windows scaling (125–150%), native browser zoom and vendor-specific GPU behavior require a Windows/device check. CSS viewport emulation and CPU throttling are not substitutes for those checks. A friend-device visual discrepancy is not considered reproduced solely by these emulations.

CI builds the unchanged PR base (or the current commit's parent) in `.motion-baseline/`, then measures baseline and candidate sequentially on the same runner against the same isolated test data. A root commit has no historical reference and runs the candidate's absolute CLS gate. `PERF_RECORD_BASELINE=1` records an available historical reference without applying candidate-only absolute gates; the candidate still enforces CLS ≤ 0.05 and all available regression limits. Reports are retained. `PERF_SERVER_ROOT` selects an already-built baseline when using `node scripts/run-motion-ci.mjs` locally; it does not change which measurement script runs.

Each Supabase CI job prepares a private temporary work directory with a unique project ID and available API, database and shadow-database ports. It copies the repository migrations, pgTAP tests and seed without linked-project metadata. API, Auth and Storage remain enabled; unused Studio, mail capture, analytics, edge runtime and pooler services are disabled only in that temporary configuration. All CLI commands use the private work directory, resets explicitly target the local database, and final cleanup stops only that job's stack. A unit test occupies the original database port and simulates a second stack to verify isolation; the repository's local configuration remains unchanged.

### Pixel-reference audit

The reviewed header uses a 12 px desktop/tablet logo inset and a 12 px right inset for navigation; phone controls retain their 12 px inset. Earlier desktop/tablet captures were refreshed after light/dark accessibility checks; the scoped 2026-10-24 update is described below. Mobile references and comparison tolerances were retained. `tests/e2e/header-layout.spec.ts` checks the approved spacing and colors, and the ultrawide matrix checks the same right inset.

Skills references cover light/dark mobile, tablet, and desktop screenshots with exact, perceptual, and geometry signatures. The four-bit geometry allowance covers SVG rasterization differences. The Skills transform hint prevents accidental text-rendering changes.

The first Projects card has one independently fetched repository-statistics row. Depending on the GitHub response, it can show the fallback language or live language/star/fork values. Pixel normalization masks only that 154×24 px metadata line at desktop (96, 325) and tablet (38, 331); project titles, descriptions, badges, cards and surrounding geometry remain locked. The mask positions were corrected after comparing two CI captures with local captures: all pixels outside the metadata row matched exactly. The four desktop/tablet signatures were recalculated with these positions.

The shared footer no longer repeats the Privacy link; Contact uses a 24 px text inset and 12 px logo inset on tablet and desktop. The copyright text aligns with the logo’s bottom edge on tablet and desktop. Phone footer spacing is unchanged. The six Contact references were refreshed after all light/dark phone, tablet and desktop accessibility captures passed; other references and comparison tolerances were retained.

### Feature-removal verification (2026-10-24)

The visual matrix now covers five pages, three viewports and two themes (30 captures). The removed page has no screenshot or source-lock entries. Twelve navigation references were refreshed for the explicitly requested menu removal: all desktop captures and both tablet Home captures. The remaining 18 references are unchanged. A separate build restored the previous header, shared styles and dictionaries; its 12 captures matched the existing approved references. Compared with that build, ten candidate captures were byte-identical below the header, one matched after the existing Home text mask, and Journey light differed by four of 1,024 body edge bits, within its existing six-bit allowance. Both pages also matched all measured main-content bounds and styles. Representative light/dark renders were visually inspected. No viewport, text mask or comparison tolerance was widened; obsolete CI signatures containing the old menu were removed.

The migration chain, deterministic seed and 36 pgTAP assertions were executed in a temporary PGlite PostgreSQL engine with pgvector and pgTAP. Supabase Storage tables and API roles were represented locally; no production service was contacted. Upgrade fixtures confirmed that Contact budgets and leases, portfolio rows, CV content and storage configuration survive, retired AI budgets and leases disappear, and the cleanup migration can be repeated. This supplements the existing isolated Supabase CI job; Docker/WSL integration was unavailable locally.
