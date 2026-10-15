# CV setup

The public `/api/cv` URL serves one private PDF from Supabase Storage. The PDF
is intentionally not stored in the Git working tree or Git history.

## Storage contract

Configure the private bucket and the exact current object path:

```bash
CV_STORAGE_BUCKET=private-cv
CV_STORAGE_OBJECT="cv/Cv .pdf"
```

Set the path separately for Vercel Preview and Production, then redeploy each
environment after a change. The value entered in Vercel must not include quotes.

The server-only Supabase key downloads the object. The bucket must not expose a
public read policy.

## Safe replacement

1. Prefer uploading the next PDF under a new versioned object name.
2. Confirm that the bytes begin with the PDF signature `%PDF-`.
3. Change `CV_STORAGE_OBJECT` in the deployment environment.
4. Deploy and invalidate the deployment/CDN cache.
5. Verify `/api/cv`, ETag, Last-Modified, and a conditional `304` response.
6. Delete the previous Storage object only after the new object is verified.

This ordering keeps rollback possible and prevents an old CDN object from
silently replacing the new CV.

## Response behavior

Successful responses include:

```text
Content-Type: application/pdf
Content-Disposition: attachment; filename="Mouaz-Naji-CV.pdf"
ETag: "<strong-sha256-value>"
Last-Modified: <Storage updated_at>
Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400
```

`If-None-Match` and `If-Modified-Since` requests return `304` when the object is
unchanged.

## Verify

```bash
curl -i https://your-domain.example/api/cv
curl -i -H 'If-None-Match: "<etag-from-first-response>"' \
  https://your-domain.example/api/cv
```

The first request must be a PDF response and the second must return `304`.

## Common failures

| Symptom | Fix |
| --- | --- |
| `Failed to fetch CV from storage` | Check Storage access and the server-only Supabase key. |
| `CV file not found` | Check the exact bucket and object path, including case and spaces, in the affected deployment environment. |
| `File is not a PDF` | Replace the object with a real PDF whose bytes begin with `%PDF-`. |
| Old CV remains at the edge | Deploy the new object path and invalidate the CDN before deleting the prior object. |
