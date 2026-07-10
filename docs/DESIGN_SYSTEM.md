# Kingdom Tribe City — Design System

Original identity. Inspired by the reference products in the PRD, not copying any of them.

## Typography

- **Display / storytelling** — `Fraunces` (variable serif, warm and editorial — MasterClass gravitas without feeling corporate-devotional). Used for hero headlines, course titles, stage names.
- **UI / body** — `Inter` — clean grotesk for everything else: nav, body copy, forms, dashboard. Notion/Apple-level legibility at small sizes.
- Both loaded via `next/font/google` in `app/layout.tsx` as CSS variables (`--font-display`, `--font-sans`), wired into Tailwind's `@theme`.

## Color

Dark-first, with a fully specified light theme (toggle via `next-themes`, see `components/theme-toggle.tsx`). Tokens live in `app/globals.css` as OKLCH CSS variables following the shadcn convention (`:root` = light, `.dark` = dark), with `<html>` defaulting to `class="dark"`.

| Token | Role | Dark | Light |
|---|---|---|---|
| `background` / `foreground` | page base | deep ink-navy / warm off-white text | warm paper white / deep ink-navy text |
| `primary` | gold — royalty, CTAs, active state | warm gold | deeper gold (contrast-adjusted for light bg) |
| `accent` | living green — growth, stage progress, success | emerald green | deeper emerald |
| `card` / `secondary` / `muted` | surface hierarchy | lighter navy steps | soft warm-gray steps |
| `destructive` | errors only | standard red, hue-matched | same |

Gold = light/royalty (CTAs, current-stage highlight). Green = growth (progress, streaks, completed states). The two accents are never used interchangeably — gold means "act on this," green means "you grew."

## Type scale & spacing

Tailwind defaults, no custom scale — deviation from the framework's spacing/type scale is exactly the kind of inconsistency this system exists to avoid. `--radius` base is shared across all corner-radius steps already defined by shadcn's `@theme inline` block (`radius-sm` … `radius-4xl`).

## Motion

`motion` (Framer Motion) used sparingly, three moments only:
1. **Lesson step transition** — content slides/fades between Teaching → Scripture → Reflection → Assignment → Journal.
2. **Streak increment** — a small celebratory pulse on the dashboard streak counter when it increases.
3. **Stage advance** — a full celebratory moment when a user's `Stage` changes (e.g. Planted → Rooted).

No decorative animation elsewhere. Apple-style restraint: motion only where it communicates state change.

## Core components (`components/`)

- `ui/` — shadcn primitives (button, card, input, tabs, dialog, progress, etc.), themed via the tokens above. Do not hand-roll a component shadcn already provides.
- `dashboard/stage-pathway.tsx` — the PLANTED→ROOTED→FORMED→FRUITFUL→SENT journey, rendered as a literal path with the current stage highlighted — not a percentage progress bar.
- `lms/lesson-stepper.tsx` — the five-step lesson flow UI.
- `lms/course-hero.tsx` — cinematic course header (cover image, title, stage badge, mentor/instructor byline).
- `community/tribe-card.tsx`, `community/discussion-thread.tsx`, `community/prayer-request-card.tsx`.
- `marketing/section-*.tsx` — public site sections (hero, story, programs grid, testimonial, partnership CTA).

## Accessibility & charts

Any progress/streak/analytics visualization follows the `dataviz` skill's contrast and palette-validation method rather than picking colors by eye — load that skill before building/editing the dashboard's chart-like elements or the admin analytics screen.
