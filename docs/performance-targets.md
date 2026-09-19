# Performance evidence and targets

The two measurement classes must never be merged.

## Local navigation smoke test

`npm run test:navigation-performance` clicks Skills, Journey, Projects, Code
Review and Contact five times in a local production server. It records every
sample, browser errors, median time to client URL commitment and median time to
visible route-specific content. The thresholds are under 200 ms and under
500 ms respectively. These are preliminary local observations, not field data.

Use `NAVIGATION_BASE_URL` to point the same script at an approved deployed
preview. Set `NAVIGATION_OUTPUT` only when a disposable report file is wanted;
the default output is stdout so no measurement artifact enters the Git diff.

## Production Core Web Vitals

The production objectives are LCP at or below 2.5 seconds, INP at or below
200 milliseconds, and CLS at or below 0.1. Evaluate all three at p75 separately
for mobile and desktop over a rolling 28-day window using real-user data.

When traffic is insufficient, report `insufficient field data`. Lighthouse and
other laboratory results remain useful diagnostics, but are not substitutes
for real-user evidence. Vercel Speed Insights is present in the application;
the deployed project's field-data view still requires human access and enough
production traffic.

## Latest local observation on 2026-09-19

Five production-mode clicks per destination passed with no recorded browser
errors:

| Destination | Median URL commitment | Median visible content |
| --- | ---: | ---: |
| Skills | 57.1 ms | 115.3 ms |
| Journey | 56.9 ms | 74.1 ms |
| Projects | 50.7 ms | 63.4 ms |
| Code Review | 56.1 ms | 61.7 ms |
| Contact | 54.3 ms | 69.3 ms |

These values are a preliminary local smoke test only. No preview measurements
or production 28-day p75 field values have been collected.

The 2026-09-14 standalone constrained-device motion run recorded Home at
1,192 ms LCP/235 ms blocking/0.0162 CLS, Skills at 4,296 ms/949 ms/0 CLS,
and Code Review at 1,104 ms/268 ms/0 CLS. No same-run comparison baseline was
supplied, so only the absolute CLS gate was evaluated and passed. Skills is a
visible lab warning; do not present this standalone run as a production p75 or
weaken a future same-run regression threshold to hide it.

That run used 4× CPU throttling without matching browser hardware hints, so it
actually selected the application's standard-power UI path. A corrected
four-core/4 GB measurement of the same pre-fix build recorded Skills at
3,624 ms LCP/583 ms blocking/0 CLS. A first low-power CSS candidate that kept
the delayed bounce recorded 3,636 ms/670 ms/0 CLS and was not an improvement.
Profiling identified the last LCP candidate as a Skills card description whose
paint was deferred by the staggered transform animation. The current candidate
renders low-power cards in their final state immediately, while retaining the
approved animation on standard devices. A new local production-browser run
with the four-core/4 GB profile recorded Home at 1,188 ms LCP/138 ms
blocking/0.0162 CLS, Skills at 3,100 ms/437 ms/0 CLS, and Code Review at
808 ms/104 ms/0 CLS. All absolute CLS gates passed. Skills improved relative
to the older same-profile pre-fix observation, but the comparison was not a
controlled same-run A/B test and the new Skills lab LCP remains above 2.5 s.
The script fails if the expected `low` tier or an actual LCP candidate is
absent. No production p75 result is available.

The final LCP candidate in an additional local Skills sample was the IDEs &
Design card description at 2,956 ms; the latest of four long tasks ended near
2,818 ms. This diagnostic is a single lab sample, not a new median or a
proven causal attribution. The 18 current local Lighthouse runs passed their
configured assertions, but the Skills Lighthouse URL uses `?audit=performance`
and suppresses normal motion. Its median 232 ms LCP is not comparable to the
normal-motion Skills
test. A headless Chromium screenshot sometimes clipped low-tier card text or
icons while the animated WebGL background ran. This also happened with the
original card animation; a static WebGL audit frame rendered cleanly, while
disabling card backdrop blur or `will-change` did not resolve it. Physical-device
and preview visual checks are still needed before changing the live background.

The normal production build reports 103 kB shared First Load JS. Route totals
are 133 kB for Home, 125 kB for Skills, 123 kB for Journey, 127 kB for Projects
and Code Review, 131 kB for Contact, and 115 kB for Privacy. No component was
split merely to reduce line count.
