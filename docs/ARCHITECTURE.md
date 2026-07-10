# Application & Data Architecture

## Stack

- **Next.js 16** (App Router, React Server Components, Server Actions), TypeScript.
- **Tailwind CSS v4** + **shadcn/ui** primitives in `components/ui`.
- **Prisma ORM 7** + **PostgreSQL** (hosted on Neon). Prisma 7 requires a driver adapter for runtime queries — see `lib/prisma.ts`, which uses `@prisma/adapter-pg`. CLI/migrate connection config lives in `prisma.config.ts`.
- **Auth.js v5** (`next-auth`) with the Credentials provider (email + password) and the Prisma adapter, JWT sessions carrying `id`, `role`, `stage`, `onboarded`.
- **Route protection**: `proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`) guards `/dashboard`, `/learn`, `/tribe`, `/admin`. Proxy is a fast, coarse gate only — every server action and route handler re-checks authorization via `lib/rbac.ts`, because proxy coverage can silently drop on refactors.
- **Stripe** for giving (test mode), webhook at `/api/webhooks/stripe`.

## Why Server Actions over hand-rolled API routes

Mutations (enrollment, reflection/journal submission, discussion posts, admin CRUD) use Next.js Server Actions colocated with the feature that owns them (`app/(app)/learn/.../actions.ts`, `app/(admin)/admin/.../actions.ts`, etc.) rather than a separate `/api` layer. This avoids duplicating request parsing/validation boilerplate and keeps the mutation next to the UI that triggers it. Route Handlers under `/api` are reserved for things that must be a real HTTP endpoint: Auth.js, Stripe webhooks.

## RBAC

Four roles: `GUEST`, `STUDENT`, `MENTOR`, `ADMIN`.

- `proxy.ts` blocks unauthenticated access to app/admin routes and redirects non-admins away from `/admin`.
- Every Server Action and Route Handler calls `requireUser()` / `requireRole()` / `requireAdmin()` from `lib/rbac.ts` before touching the database. The client-supplied session is never trusted for authorization decisions on the server — role/stage come from the JWT, populated server-side from the database at sign-in and refreshed on session `update()`.

## Data model

Full schema in `prisma/schema.prisma`. Grouped by domain:

- **Identity**: `User`, `Account`, `Session`, `VerificationToken` (Auth.js-compatible).
- **LMS**: `Program → Course → Module → Lesson`, `Enrollment`, `LessonProgress`, `ReflectionEntry`, `JournalEntry`, `Certificate`.
- **Community**: `Cohort → Tribe → TribeMembership`, `DiscussionPost/Comment`, `PrayerRequest`, `Testimony`.
- **Events**: `Event`, `Speaker`, `EventRegistration`.
- **Resources**: `Resource` (type × category).
- **Giving**: `Transaction`.
- **Ops**: `Announcement`.

Design choices:
- `User.stage` (`PLANTED..SENT`) is the literal transformation-pathway pointer — computed/advanced server-side when a stage's courses are completed, not client-editable except by an admin override.
- Streaks are **derived**, not stored: computed from `LessonProgress.completedAt` / `JournalEntry.createdAt` timestamps at read time, so there's no counter to keep in sync or drift.
- `ReflectionEntry.answers` is `Json` keyed by question index/text — the three guided prompts are stored on `Lesson.reflectionQuestions` (`String[]`) so they can change per lesson without a migration.
- Enums model everything that's a closed set (`Role`, `Stage`, `ResourceCategory`, etc.) for query-ability and referential integrity vs. free-text strings.

## Folder structure

```
/app
  /(marketing)     public site — /, /vision, /programs, /events, /testimonies, /resources, /give
  /(auth)          /sign-in, /sign-up, /onboarding
  /(app)           authenticated app shell
    /dashboard
    /learn/[courseSlug]/[lessonSlug]
    /tribe/[tribeSlug]
    /expressions/[program]
  /(admin)/admin   admin dashboard
  /api/auth/[...nextauth]
  /api/webhooks/stripe
/components
  /ui              shadcn primitives + KTC theming
  /marketing /lms /dashboard /community /admin   feature components
/lib               auth.ts, prisma.ts, rbac.ts, stripe.ts, stage.ts, streak.ts
/prisma            schema.prisma, migrations/, seed.ts
/docs              this document and its siblings
```

## Extending a scaffolded module

Scaffolded modules (Young & Yielded, Kingdom Warrior Woman, Kingdom Leaders, full events, resource uploads, recurring giving — see `ROADMAP.md`) already have complete Prisma models. To deepen one: add the feature components under its `components/<area>` folder, add Server Actions colocated with the route, and reuse the RBAC/streak/stage helpers in `lib/` rather than re-deriving them.
