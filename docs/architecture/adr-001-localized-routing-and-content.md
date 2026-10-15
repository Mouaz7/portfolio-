# ADR-001: Localized routing and content storage

## Status

Accepted

## Context

The portfolio must support English, Swedish, and Arabic, including right-to-left layout, localized metadata, editable Supabase content, and stable performance. UI labels change with releases, while profile, project, skill-category, and Journey content changes independently through Supabase.

## Decision

- Keep English on canonical unprefixed routes (`/projects`). Legacy `*-page` URLs redirect to the short routes.
- Expose Swedish and Arabic on prefixed routes (`/sv/projects`, `/ar/projects`) through a proxy rewrite, reusing the same page components.
- Load one typed, versioned UI dictionary per request and pass only that dictionary to the client provider.
- Store editable Swedish and Arabic content overrides in `content_translation`; keep English in the source tables.
- Cache locale-dependent content APIs by locale and preserve English/source fallback; locale-neutral data can share a cache entry.
- Set `lang`, `dir`, localized canonical URLs, `hreflang` alternatives, and sitemap alternatives server-side.

## Rationale

Static dictionaries make navigation and controls available without a database dependency. URL locales make links shareable and indexable. A small translation table avoids duplicating project and Journey records while allowing content edits without a deployment. Proxy rewrites preserve the shared route components.

## Trade-offs

- Proxy runs for localized page requests and adds a small routing cost.
- Translation fields use validated JSON objects, which are flexible but less strongly typed than a dedicated table per entity.
- Newly synced projects initially use English until their `sv` and `ar` translation rows are added.

## Consequences

- UI rendering does not wait for Supabase.
- Arabic receives document-level RTL behavior and targeted layout corrections.
- Content cache invalidation continues to use the existing feature tags.
- A future language requires a dictionary, locale config entry, and database locale constraint migration.
