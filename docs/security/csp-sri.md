# CSP and SRI rollout

Status: recommendation and conditional technical candidate. This document is
not evidence that the static policy, SRI, or ISR has passed deployment testing.

## Current inventory

- `proxy.ts` creates a nonce and enforces a per-request CSP for public
  pages. The layout reads request headers, so those pages are dynamically
  rendered today.
- Three application-owned, stable inline bootstrap scripts live in
  `lib/security/inline-scripts.cjs`.
- Cloudflare Turnstile requires its script/frame origin. Vercel Speed Insights
  and the configured Supabase HTTPS/WebSocket origin require connect access.
- Inline styles remain necessary to the current locked UI; removing
  `style-src 'unsafe-inline'` is a separate verified migration.

## Staged static policy

Set `CSP_STATIC_REPORT_ONLY=1` only on a preview to emit the documented static
hash candidate as `Content-Security-Policy-Report-Only`. Keep the enforced
nonce policy during observation. Review actual reports and browser console
violations; do not add broad origins or `unsafe-inline` to `script-src` merely
to silence a violation.

Only after local production, Chromium, Firefox, WebKit, and a deployed preview
pass may the static policy replace the nonce policy. Remove `headers()` and
nonce dependencies in the same isolated change, then verify route
classification and repeated response headers before considering ISR.
`revalidate = 1800` by itself is not proof of static or cached delivery.

## CSP hashes are not SRI

CSP controls which resources and scripts may load or execute. A CSP hash can
authorize a specific inline script, and CSP can also use hashes with external
scripts under the applicable browser rules. SRI places an `integrity` digest on
a fetched script or stylesheet so the browser verifies the downloaded bytes.
SRI can cover first- or third-party subresources, but it never replaces the
rest of a CSP policy.

Next.js SRI remains experimental. Set `NEXT_EXPERIMENTAL_SRI=1` only for an
isolated webpack build and verification run against the pinned Next.js version.
Do not enable it in production until local production, all three browser
engines, CSP reports, and deployed preview are stable.

## Local observation on 2026-09-14

The isolated Next.js 15.5.24 webpack build completed with SRI enabled, and the
sampled home HTML contained six `integrity` attributes. The latest report-only
policy was present on all 21 checks (seven routes, including Privacy, in
Chromium, Firefox and WebKit), but those checks recorded 291 inline
`script-src-elem` reports. They come from
Next.js-generated inline bootstrap/streaming scripts that are not covered by
the three stable application-script hashes.

Therefore the static candidate is not enforcement-ready, the nonce policy
remains active, and public routes remain dynamic. Never add `unsafe-inline` to
`script-src` merely to make this inventory pass. Re-run with
`npm run test:csp-report-only` on an approved preview after the remaining
inline-script strategy has been resolved.

The report-only command exits non-zero whenever any violation is observed. A
report file may be written outside the repository with `CSP_REPORT_OUTPUT` for
manual classification; a successful process exit is required before the
static candidate can advance.

Reference: <https://nextjs.org/docs/app/guides/content-security-policy>
