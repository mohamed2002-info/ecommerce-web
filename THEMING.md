# Theming — "Tech-Noir" design system

The app uses a token-driven design system with **dark** (default) and **light**
modes. The visual language follows the Tech-Noir aesthetic: charcoal surfaces,
an electric-blue accent, soft "engineered" radii, and Inter + JetBrains Mono.

## How it works

All colors are CSS custom properties defined in [src/styles.css](src/styles.css),
keyed by a `data-theme` attribute on `<html>`:

```css
:root, [data-theme='dark'] { --color-accent: #adc6ff; --color-bg: #121317; ... }
[data-theme='light']       { --color-accent: #2563eb; --color-bg: #f6f7f9; ... }
```

Every component styles itself with these tokens (`var(--color-surface)`,
`var(--color-text)`, `var(--color-accent)`, …), so switching the attribute
re-skins the entire app instantly — no per-component theme logic.

Theme-independent tokens (spacing, radii, fonts, motion) live in the shared
`:root` block.

## Switching themes

- **[ThemeService](src/app/services/theme.service.ts)** owns the active theme,
  persists the user's choice in `localStorage`, and writes `data-theme` on
  `<html>`.
- The header has a **sun/moon toggle** button that calls `themeService.toggle()`.
- **Default is dark.** A small inline script in [index.html](src/index.html)
  applies the persisted theme before first paint to avoid a flash.

## Key tokens

| Token | Purpose |
|-------|---------|
| `--color-bg` | page background |
| `--color-surface` / `-2` / `-3` / `-low` / `-lowest` | elevation stack |
| `--color-border` | hairline outlines |
| `--color-text` / `-muted` / `-soft` | text hierarchy |
| `--color-accent` / `-strong` / `-soft` / `--color-on-accent` | electric-blue brand |
| `--color-success` / `-danger` / `-sale` (+ `-soft`) | semantic |
| `--shadow-sm/md/lg`, `--glow-accent` | elevation |
| `--font-sans` (Inter), `--font-mono` (JetBrains Mono) | type |
| `--space-1..7`, `--radius-sm/md/lg/pill` | rhythm & shape |

## Reusable utility classes (global)

`.ds-btn`, `.ds-btn--primary`, `.ds-btn--ghost`, `.ds-badge`,
`.ds-badge--sale`, `.ds-badge--soft` — token-based primitives used across the
app (and by the promotion UI).

## Adding a new themed component

Just use the tokens — never hardcode a hex color:

```css
.my-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  border-radius: var(--radius-md);
}
```

It will automatically work in both light and dark mode.
