# Privacy data inventory

Verification date: 2026-09-13

This inventory separates behavior proven by the repository from behavior that
still needs production or contractual evidence. It is the source for the
public `/privacy` copy; unverified retention promises and inactive recipients
must not be copied into the public notice.

| Data or identifier | Purpose | Storage / current recipient | Verified lifecycle | Evidence state |
| --- | --- | --- | --- | --- |
| Theme preference | Display the selected color theme | Browser `localStorage` | Remains until the visitor changes it or clears browser storage | Verified in code |
| Locale preference | Keep the selected language | First-party cookie | Cookie `maxAge` is one year | Verified in proxy |
| Signed security session | Bind protected requests to a browser session | HTTP-only first-party cookie; digest-derived server identifiers | Cookie `maxAge` is 24 hours; server quota/lease rows expire independently | Verified in code and migrations |
| Contact name, email and message | Deliver and protect a contact request | Private Supabase rows, then the configured SMTP service and recipient mailbox | Prepared submission validity is 15 minutes. A daily cleanup selects expired rows older than two hours in batches of 100. No guaranteed maximum deletion time is established. | Code verified; production schedule and backlog monitoring still require operational evidence |
| Hashed session/network identifiers | Abuse prevention and concurrency/rate controls | Private Supabase quota and lease rows | Rows carry expiries and expired rows are removed during protected database operations | Verified in code and migrations |
| Contact email after delivery | Receive and answer the message | Configured email service and recipient mailbox | No automated 12-month deletion rule is verified | Mailbox operation unverified |
| Code-review input and follow-up context | Generate an AI review or answer | Configured external AI endpoint during the request | The application does not intentionally insert the submitted input into portfolio content tables. Provider-side handling and the production endpoint owner require separate verification. | Application flow verified; production/provider contract unverified |
| Portfolio-chat question and retrieved context | Generate a portfolio-grounded answer | Configured external AI and embedding endpoints during processing | Chat input is not intentionally persisted by the application. Indexed portfolio source chunks remain in private Supabase RAG tables until reindexed or removed. | Application flow verified; production/provider contract unverified |
| Technical page-performance data | Measure page performance | Vercel Speed Insights when `VERCEL=1` | No repository-controlled retention period is claimed | Production HTML and code presence verified; contractual retention not verified here |
| Contact attachments | Future contact delivery with quarantine and malware scanning | Private `contact-uploads` bucket and a future external scanner | Disabled unless the feature flag and scanner configuration are present. No scanner is an active recipient under this inventory. | Disabled-by-default code verified; vendor not selected |

## Release checks

- Verify the production environment and deployed HTML before naming an AI,
  email, analytics, hosting or malware-scanning recipient publicly.
- Verify that the daily contact cleanup is enabled, monitored and keeping pace
  before publishing a maximum deletion promise.
- Verify a mailbox deletion rule or controlled manual process before publishing
  a fixed email-retention period.
- Update the public notice and this inventory before enabling an attachment
  scanner or another new recipient.
- Record the reviewer, date, evidence and any exception in the release record.

This document is operational evidence, not a substitute for legal review.
