# Styling

The visual system is built around a shared ocean theme, CSS variables, Tailwind utilities, and focused component-level styles.

## Theme Tokens

`app/global.css` defines dark defaults on `:root` and light overrides on `html.light`.

Core tokens:

| Token | Purpose |
| --- | --- |
| `--bg`, `--fg` | Main background and foreground colors. |
| `--accent`, `--accent-strong` | Primary teal action color. |
| `--accent-2` | Secondary mint tone. |
| `--surface`, `--surface-2` | Panels, fields, and elevated UI. |
| `--surface-border` | Borders across cards and controls. |
| `--skills-*` | Skill card readability and icon filters. |

## Tailwind Mapping

`tailwind.config.js` maps familiar utility names to CSS variables:

- `text-white` becomes `var(--fg)`.
- `bg-black` becomes `var(--bg)`.
- `text-accent` becomes `var(--accent)`.
- legacy `cornflowerblue-*` colors now map to the teal accent system.

This keeps old component classes working while the theme changes centrally.

## Layout Patterns

- Home uses `app/home-page.module.css` plus global home classes.
- Skills uses fixed card geometry and viewport scaling.
- Journey uses a derived git graph model and responsive mobile stage sizing.
- Projects switches between row layout and mobile cards.
- Contact uses separate phone and larger-screen layouts.

## Animation Rules

Animation comes from local CSS transitions, keyframes, and focused canvas effects.

The app respects `prefers-reduced-motion` in major animated views:

- Projects loading and transitions
- Skills loading and card animation
- Journey loading and commit animation
- Contact entrance motion

## Shared Background

`SiteBackground` is mounted once in `app/layout.tsx`, behind all pages. Individual pages avoid owning their own full-screen visual background, which keeps the app consistent and reduces visual conflict.

## Design Notes

- Keep route pages visually rich but task-focused.
- Prefer one shared token system over one-off colors.
- Keep fixed-format UI stable with explicit dimensions and scaling.
- Do not add fake content to make layouts look full. Empty and loading states already exist.
