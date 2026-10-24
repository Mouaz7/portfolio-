# Database

The app uses Supabase for Postgres and Storage files. All runtime content tables are covered by tracked migrations.

## Tracked Migrations

`supabase/migrations/20260705_create_project_table.sql` creates `public.project`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, generated with `gen_random_uuid()`. |
| `title` | `text` | Required project title. |
| `description` | `text` | Defaults to empty string. |
| `category` | `text` | Used for UI grouping. |
| `github_url` | `text` | Required and unique. |
| `languages` | `text[]` | Defaults to empty array. |
| `cover_image_href` | `text` | Optional local or remote icon path. |
| `is_active` | `boolean` | Controls visibility. |
| `sort_order` | `integer` | Primary display order. |
| `created_at` | `timestamptz` | UTC timestamp. |

The migration also creates an index on `(is_active, sort_order, created_at desc)`.

`supabase/migrations/20260727_dynamic_content_management.sql` adds data-managed Home profile, role and capability content, and adds safe ordering/visibility fields to Skills, Journey, contact links, CV, health profile and projects. It is additive and preserves existing rows.

The local `supabase/migrations/20260923185543_add_cpp_teaching_assistant_2026_2027.sql` adds a separate C++ Teaching Assistant appointment for September 2026–June 2027 and Swedish/Arabic translations. It does not replace the September 2025–June 2026 row. The seed includes both periods; this file's presence is not proof that the migration has run on a remote database.

## Runtime Tables

These tables are created by the dynamic-content migration.

| Table | Used by | Minimum fields read by code |
| --- | --- | --- |
| `skill` | `/api/skills` | `id`, `name`, `category`, `icon_bucket`, `icon_path`, `icon_path_light`, `icon_alt`, `mono`, `created_at` |
| `skill_category` | `/api/skill-categories` | `name`, `title`, `blurb` |
| `journey_item` | `/api/journey` | `id`, `title`, `details`, `start_date`, `end_date`, `icon_bucket`, `icon_path`, `icon_alt` |
| `contact_social` | `/api/contact` | `id`, `name`, `href`, `svg_path`, `viewbox`, `is_active`, `sort_order` |
| `profile` | `/api/internal/health` | `id` |
| `content_translation` | Localized content APIs | `entity_type`, `entity_id`, `locale`, `fields` |

## Localized content

`supabase/migrations/20260811120000_add_content_translations.sql` adds Swedish (`sv`) and Arabic (`ar`) overrides for editable content. English remains in each source table. Fixed interface labels live in typed application dictionaries and therefore never add a database request to page rendering.

Translation rows use the source row ID and only the fields that can be localized. For example:

```sql
insert into public.content_translation (entity_type, entity_id, locale, fields)
values (
  'project',
  '<project uuid>',
  'sv',
  '{"title":"Projekttitel","description":"Projektbeskrivning"}'::jsonb
)
on conflict (entity_type, entity_id, locale) do update
set fields = excluded.fields, updated_at = timezone('utc', now());
```

Allowed entity types are `site_profile`, `home_role`, `home_capability`, `skill_category`, `project`, and `journey_item`. Public clients have read-only access through RLS; only the service role or a trusted database editor can write translations.

## Retired index cleanup

`supabase/migrations/20261024121521_remove_code_review_ai.sql` removes the retired AI index and its job locks. Apply it after deploying the application without the old routes and schedules. Historical migrations remain intact; portfolio content, CV source text, private PDF storage and Contact security tables are preserved. A migration file in this repository is not proof of production application.

## Storage

| Bucket/path | Purpose |
| --- | --- |
| `private-cv/cv/Cv .pdf` | Current private object downloaded by `/api/cv`; future replacements should use a versioned name. |
| `public/skill-icons/*` | Same-origin Skills icons; source and hash inventory is tracked in `docs/skill-icon-sources.json`. |
| Journey icon buckets | Optional logos used by `/api/journey`. |
| `contact-uploads` | Private, short-lived contact attachments uploaded with signed tokens. |

`/api/journey` can read optional Storage logos. Skills use same-origin paths and no external icon host at runtime. `/api/cv` requires the private bucket/object configured by `CV_STORAGE_BUCKET` and `CV_STORAGE_OBJECT`.

## Environment Variables

Server routes accept these Supabase variables:

```bash
SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SECRET_KEY=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
RATE_LIMIT_PEPPER=
SESSION_COOKIE_SECRET=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
TURNSTILE_EXPECTED_HOSTNAME=
CRON_SECRET=
CANONICAL_SITE_URL=

REVALIDATE_SECRET=
CV_STORAGE_BUCKET=private-cv
CV_STORAGE_OBJECT="cv/Cv .pdf"
```

Use `SUPABASE_SECRET_KEY` only on the server or in CI. Do not expose it to client-side code.
Treat any credential found in Git, logs, screenshots, chats, or another verified
exposure surface as compromised. Revoke it at the provider before installing a
fresh replacement in the affected server-side environments.

## Project Sync

`npm run sync:projects` runs `scripts/sync-projects-from-github.mts`.

It fetches public repositories for `Mouaz7` and inserts newly discovered projects. Existing project title, description, category, order, visibility and icon fields remain owned by Supabase. `GITHUB_TOKEN` is optional but helps avoid GitHub rate limits.

`.github/workflows/sync-projects.yml` currently supports manual dispatch only; its schedule remains paused until the deployed end-to-end run passes. Projects sync and cache revalidation are separate jobs with separate fail-fast validation and result reporting.

Inventory the variables read by the workflow and invoked program immediately before configuring secrets. That verified inventory is normative. With the current implementation, Projects sync uses its Supabase settings, GitHub token and canonical site URL; revalidation uses only its own URL and matching bearer secret. Preview keeps different values and is never used by this Production synchronization.

## Cache updates after Studio edits

The content APIs keep their 30-minute shared cache for page speed. To publish a Supabase Studio edit immediately, create a Supabase Database Webhook that sends a `POST` request to `https://your-domain/api/internal/revalidate` with `Authorization: Bearer <REVALIDATE_SECRET>` and one of these payloads:

```json
{ "tags": ["home-content"] }
{ "tags": ["projects"] }
{ "tags": ["skills"] }
{ "tags": ["journey"] }
{ "tags": ["contact"] }
```

The endpoint accepts only these tags and rejects every request without the secret.
