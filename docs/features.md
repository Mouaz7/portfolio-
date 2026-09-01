# Features

## Home

The home route (`/`) introduces Mouaz with animated text, a role cycler, capability cards, a portrait image, and CTAs for projects and CV download.

Key files:

- `app/home-page.tsx`
- `components/home/RoleCycler.tsx`
- `components/home/TypeText.tsx`
- `components/home/download-cv-button.tsx`

## Skills

`/skills-page` renders a responsive bento grid. Its server entry preloads categories and skills in parallel; `/api/skill-categories` and `/api/skills` expose the same cached DTOs. All Skills icons are self-hosted under `public/skill-icons` and verified against `docs/skill-icon-sources.json`, so the page does not depend on external icon servers at runtime.

The grid uses fixed stage geometry and scales for desktop, tablet, and phone layouts instead of letting cards collapse randomly.

## Projects

`/projects-page` preloads Supabase projects and the public GitHub repository list in parallel, groups projects by category, and shows GitHub-linked cards. Data can be refreshed with `npm run sync:projects`.

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
- `/code-review-page` provides a native code editor, result workspace, and code assistant. It calls `/api/ai/code-review` and `/api/ai/code-review/chat` and stores no submitted code, review output, or conversation.
- `/ai-page` remains a backwards-compatible redirect to `/`.

The language selector supports `Auto`, `Svenska`, `English`, and `العربية`. Arabic output uses RTL layout; input fields use `dir="auto"`.

## Journey

`/journey` server-loads the same cached data exposed by `/api/journey` and renders Journey rows as a git-style commit graph.

`lib/journey/deriveGitGraph.ts` is pure logic. It derives branch names, commit hashes, status, branch lanes, and stats from journey rows.

## Contact

`/contact-page` combines social links and an email form.

The contact flow first validates bounded JSON and creates signed Supabase Storage uploads, then verifies session/submission state and the real Storage object set before taking a mail-concurrency lease. It atomically claims the submission, downloads files sequentially, validates declared and actual sizes, MIME types and signatures, and only then sends SMTP mail. PDF, PNG, JPG/JPEG, WebP and TXT are allowed; the aggregate limit is 10 MB.

## CV Download

The home CTA calls `/api/cv`. The API reads only the configured private, version-named Supabase Storage PDF. It validates the PDF signature and returns strong ETag and Last-Modified validators, conditional `304` responses, and controlled browser/CDN caching.

## Loading behavior

Skills, Journey, and Projects render immediately when their server preload is available. If server preloading fails, the existing loading stage accompanies a real client fetch and remains visible for at least 400 ms. Code Review renders directly during normal navigation; only genuine route/chunk loading uses the shared route-level loading stage.


## Theme and Navigation

`components/navigation/Header.tsx` owns route buttons, mobile menu behavior, theme toggle, and optional scroll navigation through `RouteScrollNavigator`.

`app/layout.tsx` runs a small pre-paint script to restore light mode from `localStorage` and avoid a theme flash.
