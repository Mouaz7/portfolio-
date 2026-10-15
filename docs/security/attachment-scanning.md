# Attachment quarantine and scanner evaluation

Status: new technical decision for the provider-neutral boundary. No malware
vendor has been selected or approved.

Uploads are disabled by default. They become available only when
`CONTACT_ATTACHMENTS_ENABLED=true`, an HTTPS scanner gateway and its token are
configured. Objects stay in the private `contact-uploads` bucket. After file
count, size, storage manifest, MIME declaration and byte-signature checks, the
server sends each file to the gateway. Only `clean` reaches email delivery;
`infected`, timeout, malformed response and provider failure all fail closed.

The gateway contract is intentionally small: multipart field `file` in, JSON
`{"status":"clean"}` or `{"status":"infected"}` out. Public errors expose
only `pending_scan`, `clean`, `infected` or `scan_failed`, never provider
details, credentials, hashes or internal object paths.

## Procurement comparison (checked 2026-09-13)

| Criterion | Cloudmersive Virus Scan API | OPSWAT MetaDefender Cloud |
| --- | --- | --- |
| EU processing | Business tier lists Germany as an EU region; region selection must be confirmed in the order/configuration. | A Germany endpoint is documented, and OPSWAT states uploaded files stay in the designated region. |
| Published entry economics | Business: USD 49.99/month, 25,000 calls/month, 2 calls/second and 1 GB plan file limit. The free tier is North America only. | Licensing is call-based across Standard, Professional and Enterprise; current exact commercial price and purchased rate limit must be obtained before selection. |
| Retention | Cloudmersive describes applicable stateless APIs as transient and not storing data; confirm that the selected virus endpoint and logs are covered contractually. | Normal scans may be retained indefinitely. Paid private scanning removes files after analysis, while result metadata remains. Private mode must therefore be mandatory. |
| DPA/GDPR | A published DPA covers GDPR but says acceptance requires contacting sales. Confirm sub-processors and transfer terms. | A published DPA covers GDPR and SCCs. Confirm the signed order, sub-processors and private-scan terms. |
| Timeout/SLA | No suitable public scan-time SLA was found in the reviewed material; test p75/p95 with the portfolio's 10 MB cap. | Published scan SLA is 8 seconds at p50/p75/p90 depending on plan, with 99.5–99.9% availability by tier. The synchronous app timeout must be reconciled with this. |

Primary vendor material:

- Cloudmersive pricing: <https://cloudmersive.com/pricing-small-business>
- Cloudmersive security/residency: <https://www.cloudmersive.com/security>
- Cloudmersive DPA: <https://www2.cloudmersive.com/data-processing-dpa>
- OPSWAT locations and retention: <https://www.opswat.com/docs/mdcloud/compliance/locations>
- OPSWAT API security/private scanning: <https://www.opswat.com/docs/mdcloud/operation/api-security-faq>
- OPSWAT licensing behavior: <https://www.opswat.com/docs/mdcloud/account-management>
- OPSWAT DPA: <https://www.opswat.com/legal/data-processing>

Before enabling uploads, a human must approve price, signed DPA, GDPR transfer
assessment, actual endpoint location, sub-processors, private-mode retention,
file/API limits, timeout behavior, false positives, outage handling and a tested
data-deletion process. EICAR must be used only in an isolated approved test.
