# Audit implementation status

This ledger is a dated **2026-09-19 audit snapshot**, not a live release status.
Its test counts, hashes, deployment-access findings and bundle sizes do not
verify the present Next.js 16 working tree or the local seven-row Journey
candidate. Re-run the checks on the exact candidate before making a release
decision. The rows below preserve the original evidence and unresolved gates;
they must not be used to claim that the repository is ready to publish.

## Verified locally and in isolated CI

| Item | Evidence and current state |
| --- | --- |
| Working-copy preservation | Branch, status and the complete diff were rechecked without reset. The latest private backup on 2026-09-19 contains 357 present tracked/untracked files, Git status and binary diff, base commit, inventory, per-file checksums and a verified tar archive. The separately checksum-verified copy is in the restricted `/root/portfolio-release-backups/2026-09-19-release-cleanup-final` directory outside Git. This is local storage, **not an off-machine backup**. The recovered files were compared byte-for-byte with a fresh clone before the validation commit. No generated test artifact is in the Git diff. |
| Required font and production build | `app/fonts/urbanist-latin.woff2` is present. A normal webpack production build passed again on 2026-09-19 after the final low-power Skills CSS change, with five independently generated disposable values supplied for missing security/job configuration. Public pages remain dynamically rendered because the nonce/request-header path is still active; ISR is not claimed. |
| Unit/static checks | Lint, TypeScript and 43 Jest suites/252 tests passed again on 2026-09-19. The expanded default Knip dead-code check passes after removing an unused icon-vendor script that could overwrite an old migration; the CI motion entrypoint is explicitly retained. A separate production-mode Knip run reports exports used only by tests/tooling and is not treated as authority to delete them. Full/production-only npm audits passed before the latest Skills CSS comment change; they were not rerun for that comment-only change. `git diff --check` also passes. |
| Dependency licence triage | The current lockfile audit covers 868 package entries and finds zero missing or automatically blocked licence identifiers. It now lists 40 package entries outside a narrow standard-permissive set, with name, path, version, development and optional flags. This is a human review queue, **not** legal approval or proof that every listed platform package ships in production. |
| Local browser suite | The current production build passed all 132 Playwright tests in Chromium, Firefox and WebKit on 2026-09-19, including the low-power Skills assertion, accessibility, forced colors, 400% reflow and reduced motion. No deployed-preview or physical-device result is claimed. |
| Accessibility automation | All 36 route/viewport/theme axe checks pass with zero allowed serious or critical contrast exceptions. Both code-review listboxes have automated keyboard and ARIA coverage. Manual screen-reader approval is still outstanding. |
| Translation policy implementation | A forward-only parent-aware RLS migration and pgTAP coverage were added. Local pgTAP remains unavailable without Supabase CLI/Docker integration, but the independent `Isolated migrations and pgTAP` job passed on validation SHA `efcc12d5a95cedeb9a417f2e5d57e4b642a7028a` after `supabase start`, `supabase db reset` and `supabase test db --local` ([CI run](https://github.com/Mouaz7/portfolio-/actions/runs/35473712187)). This verifies an isolated CI database, not production migration. |
| Validation-branch CI | The first Quality run on `a773380f76d755eb618d39b640880ffa6f490919` passed npm audits, both history scanners and license inventory, then failed at the existing design lock. On `efcc12d5a95cedeb9a417f2e5d57e4b642a7028a`, pgTAP passed independently while Quality still failed at design lock. Neither run is a green release gate; no baseline or lock hash was changed. |
| General history scanner | On 2026-09-19, pinned Gitleaks passed the fresh post-push GitHub mirror: 16 reachable commits and zero reported leaks. This cannot rule out credentials in logs, screenshots, chat or other exposure surfaces. |
| Project history scanner | The fresh post-push GitHub mirror passed the project scanner across 16 commits and 407 blobs with zero student-address or credential findings. The pre-rewrite remote had 15 redacted student-address commit findings. Old clones and caches may still retain those objects. |
| Rewrite integrity | The approved atomic two-ref push completed on 2026-09-19. Fresh GitHub `main` is `cf067b805056012ca2dca8c69a280b4a53ee96eb` and `fix/responsive-skills-scale` is `8e5e6a75ddece2c670d4ebd3c29f4b827f9741ce`. All 16 mapped commits are reachable, their trees match the originals byte-for-byte, no additional branch or tag appeared, and `git fsck --full --strict` passed. The temporary force-push exception was removed immediately; the previous protection settings were verified unchanged. |
| Privacy implementation | Localised Swedish, English and Arabic privacy content describes only verified processing, treats 15 minutes as request validity rather than deletion, makes no unsupported mailbox-retention promise, and lists no inactive malware provider. Links exist from Contact, Code Review and README. |
| Safe logging | Server-only structured logging uses an explicit allowlist. NVIDIA and other server paths do not emit raw provider bodies, prompts, credentials, email/IP/header/file metadata or complete database errors. Regression tests use sensitive markers and pass. |
| Workflow separation | The scheduled Projects trigger is paused while manual dispatch remains. Sync, revalidation and RAG are separate jobs with fail-fast checks and environment mappings derived from current workflow/script usage. |
| PR workflow least privilege | The PR title and size jobs now request read-only repository/PR access. The title action uses the automatically scoped GitHub token; the size job reads its base ref through an environment variable rather than interpolating it into shell source. The workflow parses locally, but fork permissions and actual check names still require verification on GitHub after publication. |
| Upload boundary | A provider-neutral scanner contract, private quarantine flow, explicit `pending_scan`, `clean`, `infected` and `scan_failed` states, and fail-closed tests exist. Upload remains disabled pending procurement, deployed verification and privacy-policy update. |
| Legacy project icons | The nine old project-icon URLs have been restored byte-for-byte. Design-lock now verifies both the legacy file and its byte-identical shared target, without changing approved hashes. Keep both until new target URLs are verified on a deployed version and the database rows have been migrated and checked. |

## Preliminary local observations

| Item | Evidence and limitation |
| --- | --- |
| Navigation latency | On 2026-09-19, five local production clicks per destination completed with no recorded browser errors and passed the <200 ms URL/<500 ms visible-content median targets. Median URL/visible-content times were Skills 57.1/115.3 ms, Journey 56.9/74.1 ms, Projects 50.7/63.4 ms, Code Review 56.1/61.7 ms and Contact 54.3/69.3 ms. No deployed-preview samples exist. |
| Lighthouse | All 18 current local lab runs passed configured assertions. Median performance scores were 100; median LCP ranged from 148 to 232 ms and the highest median CLS was 0.0301. The Skills Lighthouse route uses `?audit=performance`, which suppresses normal motion and must not be presented as normal-mode Skills LCP. These are lab results, not 28-day production p75 field data. |
| Motion | The corrected four-core/4 GB pre-fix observation was Skills 3,624 ms LCP/583 ms blocking/0 CLS. The current low-power candidate measured Home 1,188 ms/138 ms/0.0162 CLS, Skills 3,100 ms/437 ms/0 CLS, and Code Review 808 ms/104 ms/0 CLS. All absolute CLS gates passed. This is an improvement against an older same-profile observation, **not** a controlled same-run comparison or production field result. Skills remains above 2.5 seconds in this lab run. The older 4× CPU 4,296 ms Skills run selected the standard-power path and is not a valid constrained-path baseline. |
| Route bundles | The normal build reports 103 kB shared First Load JS. Route totals are Home 133 kB, Skills 125 kB, Journey 123 kB, Projects 127 kB, Code Review 127 kB, Contact 131 kB and Privacy 115 kB. No component was split only to reduce line count. |

## Reproduced unresolved gates

| Item | Current state |
| --- | --- |
| Pixel lock | 24 of 36 current screenshots differ from the existing approved hashes after the full browser run. All six Skills screenshots pass; failures are Code Review 6/6, Contact 6/6, Home 5/6, Journey 5/6 and Projects 2/6. Possible sources include intentional WCAG color-variable changes, privacy/footer content and canonical navigation work, but each difference still requires manual visual approval. No baseline image or hash was replaced. |
| Fresh pixel-lock rerun | The 2026-09-19 rerun still reports the same 24/36 failures. Representative current images were inspected at native resolution, but approved reference PNG files are not present in the repository; the existing approved hashes alone cannot establish which visual differences are acceptable. No hash was changed. |
| Design lock | Three locked files differ: `app/global.css` was split into three ordered stylesheets (with token changes), `components/navigation/Header.tsx` now uses canonical routes and navigation handling, and `app/code-review-page.module.css` contains the visible privacy notice and contrast adjustment. These are explanations for the source diff, not visual approval. Review rendered results before accepting any change; hashes were not updated. |
| Fresh design-lock rerun | The 2026-09-19 rerun still fails on exactly those three files. No hash or screenshot baseline was changed. |
| Static CSP candidate | The report-only static hash candidate produces 291 inline `script-src-elem` violations across 21 route/browser checks because Next.js 15 emits bootstrap/RSC inline scripts. It is not safe to enforce. The working nonce CSP remains active, and SRI is not treated as a CSP replacement. |
| Deployment and PR access | The connected Vercel account lists no teams and returns 403 for project team `mouaz2`; no preview of an exact candidate commit has been verified. GitHub CLI is authenticated as repository owner with Admin access and `repo` scope, but GitHub rejects PR creation through both the connected app and CLI; the REST pull-request endpoint returns 404. The validation branch is pushed, but no PR exists and no merge was attempted. |
| Low-power Skills visual check | Browser profiling identified delayed card-description paint. The current rule renders cards in their final state immediately on low-power devices while retaining standard-device animation. Computed card bounds and all 1,615 body-text characters matched locally; the current production page rendered nine cards without console errors or an error overlay. Headless Chromium intermittently clipped card text/icons in screenshots while the animated WebGL background ran, including with the original card animation. A static WebGL audit frame rendered cleanly; removing card backdrop blur or its `will-change` hint did not resolve the issue. Whether this affects physical devices is unknown. Check low-power hardware and deployed preview before visual approval; no reference image or hash was changed. |

## External or human gates

- Rotate/revoke every confirmed or reasonably potentially exposed credential
  in its provider. Repository scanning cannot perform or prove provider-side
  invalidation.
- Review the successful isolated CI pgTAP evidence; a production migration
  still requires separate approval and rollback planning.
- Perform the manual screen-reader, asset/code-origin, proprietary-licence and
  intentional visual-difference reviews.
- Supply and verify the real production job/CV configuration without placing
  secret values in logs or Git.
- Create and verify a deployed preview of the exact candidate PR commit. A
  read-only Vercel deployment listing returned 403 for team scope `mouaz2`;
  local browser results and older deployments are not preview evidence.
- Public-repository CodeQL, secret-scanning, push-protection and ruleset gates
  belong to a later, separately approved publication release. This cleanup
  keeps the current repository private and does not rename it.
- Collect 28-day production p75 LCP, INP and CLS separately for mobile and
  desktop. Until enough traffic exists, report `insufficient field data`.

## Authenticated GitHub snapshot

As checked on 2026-09-19, `Mouaz7/portfolio-` is still private. The two
rewritten refs have the SHAs above. The non-merge validation branch
`release/portfolio-audit-cleanup` contains the recovered candidate and CI
change; the temporary `fix/release-validation` branch was deleted after its
tested commit became an ancestor of the release branch. `main` remains at the
rewritten SHA. As
checked on 2026-09-14, secret scanning and
code scanning are disabled, no ruleset exists, and recent conditional CodeQL
runs are skipped. Classic `main` protection enforces administrators and
resolved conversations and blocks force-push/deletion, but does not yet require
pull requests or status checks. These are pre-publication facts, not passed
release controls; see `docs/github-hardening.md`.

Existing approved visual references and hash values must never be replaced by
automation. A missing reference may be generated only in a separate step and
must receive manual approval before becoming a baseline. No release PR has been
merged. Generated browser screenshots, Lighthouse
reports and coverage remain ignored by Git and are retained locally as review
evidence; they do not appear in the Git diff.
