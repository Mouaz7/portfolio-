# Features

## Home

The home route (`/`) introduces Mouaz with animated text, a role cycler, capability cards, a portrait image, and CTAs for projects and CV download.

Key files:

- `app/home-page.tsx`
- `components/home/RoleCycler.tsx`
- `components/home/TypeText.tsx`
- `components/home/download-cv-button.tsx`

## Skills

`/skills` renders nine responsive repository cards with the current seed data. Its server entry preloads categories and skills in parallel; `/api/skill-categories` and `/api/skills` expose the same cached DTOs. All Skills icons are self-hosted under `public/skill-icons` and verified against `docs/skill-icon-sources.json`, so the page does not depend on external icon servers at runtime. The old `/skills-page` URL redirects to `/skills`.

The grid uses fixed stage geometry and scales for desktop, tablet, and phone layouts instead of letting cards collapse randomly.

## Projects

`/projects` preloads Supabase projects, groups them by category, and shows GitHub-linked cards. Repository statistics load separately after the cards are visible. Project data can be refreshed with `npm run sync:projects`; the old `/projects-page` URL redirects to `/projects`.

Project categories are defined in `lib/projects/githubSync.ts`:

- `Full-Stack`
- `Build`
- `Mobile`
- `Systems`

## AI Tools

The code-review page includes one integrated multilingual code assistant. The portfolio has no competing global floating chatbot.

- Portfolio questions in the assistant call `/api/ai/cv-chat`, which retrieves CV, project, skill, journey, and profile context from Supabase pgvector.
- Retrieval includes recent conversation context, filters weak or near-duplicate matches, and limits repeated chunks from one source. If no relevant portfolio information exists, the API returns a short localized answer without calling the language model.
- Portfolio data stays internal to the answer flow. The chatbot performs no live web search, and the API does not return citations or a source list.
- `/code-review` provides a native code editor, result workspace, and code assistant. It calls `/api/ai/code-review` and `/api/ai/code-review/chat` and stores no submitted code, review output, or conversation. The old `/code-review-page` URL redirects here.
- `/ai-page` remains a backwards-compatible redirect to `/`.

The language selector supports `Auto`, `Svenska`, `English`, and `العربية`. Arabic output uses RTL layout; input fields use `dir="auto"`.

## Journey

`/journey` server-loads the same cached data exposed by `/api/journey` and renders seven Journey rows as a git-style commit graph in the current seed. The 2025–2026 and 2026–2027 C++ Teaching Assistant appointments remain separate rows; the new database migration must be applied in its intended environment before that seventh row appears there.

`lib/journey/deriveGitGraph.ts` is pure logic. It derives branch names, commit hashes, status, branch lanes, and stats from journey rows.

## Contact

`/contact` combines social links and an email form. The old `/contact-page` URL redirects here.

Contact message delivery works without attachments. Attachments are disabled by default; when a scanner is configured and the feature is explicitly enabled, the flow validates bounded JSON, creates signed private Supabase Storage uploads, verifies the exact object set and a clean scan verdict, then claims the submission before SMTP delivery. PDF, PNG, JPG/JPEG, WebP and TXT are allowed up to 10 MB combined in that enabled mode.

## CV Download

The home CTA calls `/api/cv`. The API reads only the configured private Supabase Storage PDF. It validates the PDF signature and returns strong ETag and Last-Modified validators, conditional `304` responses, and controlled browser/CDN caching.

## Loading behavior

Skills, Journey, and Projects render immediately when their server preload is available. If server preloading fails, the existing loading stage accompanies a real client fetch only while it is pending; there is no artificial 400 ms minimum. Code Review renders directly during normal navigation; only genuine route/chunk loading uses the shared route-level loading stage.


## Theme and Navigation

`components/navigation/Header.tsx` owns route buttons, mobile menu behavior, theme toggle, and optional scroll navigation through `RouteScrollNavigator`.

`app/layout.tsx` runs a small pre-paint script to restore light mode from `localStorage` and avoid a theme flash.
