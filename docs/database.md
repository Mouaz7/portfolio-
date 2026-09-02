# Database

The app uses Supabase for Postgres, pgvector semantic search, and Storage files. All runtime content tables are covered by tracked migrations.

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

`supabase/migrations/20260722_create_multilingual_rag.sql` creates the multilingual RAG layer used by `/api/ai/cv-chat`.

| Object | Purpose |
| --- | --- |
| `extensions.vector` | pgvector extension for semantic search. |
| `rag_source` | One row per indexed source from CV, projects, skills, or journey. |
| `rag_chunk` | Chunk text and 2048-dimension embedding vectors. |
| `rag_index_run` | Index refresh audit/status rows. |
| `match_rag_chunks` | RPC used by `/api/ai/cv-chat` for ranked retrieval. |

The RAG migration enables RLS on RAG tables, grants no public table access, and grants RPC execution to `service_role`. It also adds B-tree indexes for existing portfolio queries and an HNSW index over `rag_chunk.embedding::halfvec(2048)`.

`supabase/migrations/20260727_dynamic_content_management.sql` adds data-managed Home profile, role and capability content, and adds safe ordering/visibility fields to Skills, Journey, contact links, CV, health profile and projects. It is additive and preserves existing rows.

## Runtime Tables

These tables are created by the dynamic-content migration.

| Table | Used by | Minimum fields read by code |
| --- | --- | --- |
| `skill` | `/api/skills` | `id`, `name`, `category`, `icon_bucket`, `icon_path`, `icon_path_light`, `icon_alt`, `mono`, `created_at` |
| `skill_category` | `/api/skill-categories` | `name`, `title`, `blurb` |
| `journey_item` | `/api/journey` | `id`, `title`, `details`, `start_date`, `end_date`, `icon_bucket`, `icon_path`, `icon_alt` |
| `contact_social` | `/api/contact` | `id`, `name`, `href`, `svg_path`, `viewbox`, `is_active`, `sort_order` |
| `profile` | `/api/internal/health` | `id` |
| `site_cv` | `/api/ai/cv-chat` | `id`, `content`, `updated_at` |
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

## RAG Refresh

`/api/internal/rag/reindex` builds deterministic source snapshots from Home profile data, `site_cv`, active public `project` rows, active skills/categories, and active `journey_item` rows. A protected 04:00 UTC cron and the GitHub sync invoke it; chat requests only retrieve existing chunks. A database lease prevents overlapping runs, SHA-256 hashes skip unchanged sources, and each source replacement is atomic. The active embedding model ID is part of the hash, so changing models automatically rebuilds every vector with a consistent embedding space.

## Storage

| Bucket/path | Purpose |
| --- | --- |
| `private-cv/cv/Mouaz-Naji-CV-<version>.pdf` | Private, version-named object downloaded by `/api/cv`. |
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
RAG_JOB_SECRET=
CANONICAL_SITE_URL=

NVIDIA_API_BASE_URL=
NVIDIA_API_KEY=
NVIDIA_CV_CHAT_API_KEY=
NVIDIA_CODE_REVIEW_API_KEY=
NVIDIA_FALLBACK_API_KEY=
NVIDIA_EMBEDDING_API_KEY=
NVIDIA_CV_CHAT_MODEL=poolside/laguna-xs-2.1
NVIDIA_CODE_REVIEW_MODEL=poolside/laguna-xs-2.1
NVIDIA_FALLBACK_MODEL=nvidia/nemotron-3.5-lightning-30b-a3b
NVIDIA_STABLE_FALLBACK_MODEL=poolside/laguna-xs-2.1
NVIDIA_EMBEDDING_MODEL=nvidia/nemotron-3-embed-1b
REVALIDATE_SECRET=
CV_STORAGE_BUCKET=private-cv
CV_STORAGE_OBJECT=cv/Mouaz-Naji-CV-2026-08.pdf
# Optional extra fallback secrets, server-side only:
# NVIDIA_DEEPSEEK_PRO_API_KEY=
# NVIDIA_DEEPSEEK_PRO_MODEL=deepseek-ai/deepseek-v4-pro-0813
```

Use `SUPABASE_SECRET_KEY` only on the server or in CI. Do not expose it to client-side code.
Rotate any NVIDIA key that was pasted into chat, logs, screenshots, or committed files.

## Project Sync

`npm run sync:projects` runs `scripts/sync-projects-from-github.ts`.

It fetches public repositories for `Mouaz7` and inserts newly discovered projects. Existing project title, description, category, order, visibility and icon fields remain owned by Supabase. `GITHUB_TOKEN` is optional but helps avoid GitHub rate limits.

`.github/workflows/sync-projects.yml` runs the same sync daily and supports manual dispatch. Configure `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `REVALIDATE_SECRET`, and `RAG_JOB_SECRET` as repository secrets. GitHub supplies `GITHUB_TOKEN` automatically. Configure the public Production origin once as the non-sensitive repository variable `CANONICAL_SITE_URL`; the workflow uses it for synchronization, project-cache revalidation, and the protected RAG refresh.

The GitHub `REVALIDATE_SECRET` and `RAG_JOB_SECRET` values must match the separately scoped Vercel Production values. Preview keeps different values and is never used by this scheduled Production synchronization.

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
