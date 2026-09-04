# Testing Guide

Tests use Jest, React Testing Library, and `jest-environment-jsdom`.

## Commands

```bash
npm run test:ci
npm run test:coverage
```

`npm run test` starts Jest in watch mode.

## Setup Files

| File | Purpose |
| --- | --- |
| `jest.config.js` | Next/Jest integration, path aliases, coverage collection. |
| `jest.setup.js` | Test environment variables and browser mocks. |
| `__tests__/` | Component, API, utility, and environment tests. |

## Test Environment

`jest.setup.js` provides test defaults for:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `CONTACT_TO`
- browser APIs used by responsive and animated components

This keeps tests from requiring real production secrets.

## What To Test

| Area | Good checks |
| --- | --- |
| Components | Render states, labels, navigation, responsive behavior. |
| API routes | Success shape, validation failures, missing backend errors. |
| Utilities | Pure mapping logic, validation, graph derivation. |
| Environment | Required variable detection and safe defaults. |

## Patterns

- Prefer accessible queries such as `getByRole` and `getByLabelText`.
- Mock network calls close to the component that owns them.
- Keep Supabase and SMTP calls out of unit tests unless explicitly mocked.
- Test pure helpers directly. `lib/journey/deriveGitGraph.ts` is a good example.

## Before Opening a PR

```bash
npm run test:ci
npx tsc --noEmit
npm run build
```

Run `npm run lint` too if your local Next version supports the configured command.

## Browser Layout Matrix

`tests/e2e/public-pages.spec.ts` protects the responsive layout with Playwright:

- compact laptops: 800×600, 900×600, 1024×600, 1024×768, 1280×720, 1366×768;
- portrait tablets and foldables: 712×1138, 768×1024, 853×1280, 912×1368, 960×1440, 1032×1376;
- compact display: 1280×800;
- wide displays: 1920×1080, 2560×1440, 3440×1440, 3840×2160;
- browser-zoom equivalents: 853 px at 150% and 640 px at 200%.

The matrix checks horizontal overflow, bounded and centered ultrawide content, light/dark theme stability, compact-header switching, and accessible contact-form validation focus.
