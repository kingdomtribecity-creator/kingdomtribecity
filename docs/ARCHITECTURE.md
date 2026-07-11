# Application & Data Architecture

## Stack

- **Next.js 16** (App Router, React Server Components, Server Actions), TypeScript.
- **Tailwind CSS v4** + **shadcn/ui** primitives in `components/ui`.
- **Prisma ORM 7** + **PostgreSQL** (hosted on Neon). Prisma 7 requires a driver adapter for runtime queries — see `lib/prisma.ts`, which uses `@prisma/adapter-pg`. CLI/migrate connection config lives in `prisma.config.ts`.
- **Auth.js v5** (`next-auth`) with the Credentials provider (email + password) and the Prisma adapter, JWT sessions carrying `id`, `role`, `stage`, `onboarded`.
- **Route protection**: `proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`) guards `/dashboard`, `/learn`, `/tribe`, `/admin`. Proxy is a fast, coarse gate only — every server action and route handler re-checks authorization via `lib/rbac.ts`, because proxy coverage can silently drop on refactors.
- **Stripe** for giving (test mode), webhook at `/api/webhooks/stripe`.
- **Cloudflare R2** (S3-compatible) for media storage — see "Media & storage pipeline" below.

## Why Server Actions over hand-rolled API routes

Mutations (enrollment, reflection/journal submission, discussion posts, admin CRUD) use Next.js Server Actions colocated with the feature that owns them (`app/(app)/learn/.../actions.ts`, `lib/actions/admin*.ts`, etc.) rather than a separate `/api` layer. This avoids duplicating request parsing/validation boilerplate and keeps the mutation next to the UI that triggers it. Route Handlers under `/api` are reserved for things that must be a real HTTP endpoint: Auth.js, Stripe webhooks, and the R2 media-serving proxy.

## RBAC & Permissions

Eight roles (`lib/generated/prisma/enums` → `Role`): `SUPER_ADMIN`, `ADMIN`, `MINISTRY_LEADER`, `INSTRUCTOR`, `MENTOR`, `STUDENT`, `MEMBER`, `GUEST`.

The role set itself is a fixed enum (adding a ninth role is a migration), but **which permissions each role grants is data, not code** — the scalability the platform needs. Two layers:

1. **`Permission` / `RolePermission`** (`prisma/schema.prisma`) — a catalog of permission keys (`content.manage`, `users.manage`, `events.manage`, …, defined in `lib/permissions.ts`) joined to roles. Editable at `/admin/settings/roles` (admin-only) with zero redeploy. Seeded with a sensible default grid in `prisma/seed.ts`.
2. **`lib/rbac.ts`** — the enforcement layer:
   - `requireUser()` — session must exist.
   - `requireRole(...roles)` / `requireAdmin()` (`ADMIN` or `SUPER_ADMIN`) / `requireMentorOrAdmin()` — hardcoded role checks, reserved for platform-critical operations (user role changes, the permission matrix itself) that must never be delegatable through the very permission system they control — that would risk a lockout.
   - `requireAdminArea()` — the coarse gate for entering `/admin` at all (`SUPER_ADMIN`, `ADMIN`, `MINISTRY_LEADER`, `INSTRUCTOR`); individual pages then scope further.
   - `requirePermission(key)` / `hasPermission(role, key)` — the flexible, data-driven check used for everything else (content, events, cohorts, announcements, media uploads). `SUPER_ADMIN` always passes without a lookup.

`INSTRUCTOR` gets an additional scoping layer on top of permissions: they only see/edit `Course`s and `Resource`s they authored (`Course.authorId`, `Resource.createdById`), enforced both in the list-page queries and in each mutation (`assertCourseAccess()` in `lib/actions/admin.ts`).

Client-supplied role/permission state is never trusted — role/stage come from the JWT (server-populated at sign-in, refreshed via session `update()`), and every mutation re-derives the user server-side.

## Media & storage pipeline (Cloudflare R2)

`lib/r2.ts` wraps R2 (S3-compatible) via `@aws-sdk/client-s3`. Upload flow, used by `components/admin/media-uploader.tsx`:

1. Client asks `requestUploadAction(category, filename, mimeType)` (`lib/actions/media.ts`) for a presigned `PUT` URL — this checks `media.upload` permission and builds a unique object key.
2. Client `PUT`s the file bytes **directly to R2** from the browser (bypasses our server entirely — required for large video files given serverless body/duration limits).
3. Client calls `createMediaAssetAction()` to persist a `MediaAsset` row (filename, mime type, size, kind, uploader).

**Serving**: `publicUrlForKey()` prefers a real public bucket domain (`R2_PUBLIC_URL`, set once a custom domain or the R2.dev subdomain is configured in the Cloudflare dashboard) and falls back to `/api/media/[...key]` — a Route Handler that authenticates to the private bucket with the same credentials and streams the object out, so uploads work from day one even before the bucket is public. Swapping in `R2_PUBLIC_URL` later needs no code change.

Both `lib/r2.ts` (`r2Configured`) and `lib/stripe.ts` (`stripeConfigured`) follow the same pattern: the app builds and runs without those credentials, degrading the specific feature gracefully (an "storage not connected yet" state in the uploader, a clear error in the give flow) rather than crashing.

## Data model

Full schema in `prisma/schema.prisma`. Grouped by domain:

- **Identity**: `User`, `Account`, `Session`, `VerificationToken` (Auth.js-compatible).
- **Permissions**: `Permission`, `RolePermission`.
- **Media**: `MediaAsset` (R2-backed; `kind` = `VIDEO`/`AUDIO`/`IMAGE`/`DOCUMENT`).
- **LMS**: `Program → Course (authorId?) → Module → Lesson`, `Enrollment`, `LessonProgress`, `ReflectionEntry`, `JournalEntry`, `Certificate`.
- **Community**: `Cohort → Tribe → TribeMembership`, `DiscussionPost/Comment`, `PrayerRequest`, `Testimony`.
- **Events**: `Event`, `Speaker`, `EventRegistration`.
- **Resources**: `Resource` — expanded content taxonomy (`ResourceType`: video/audio/sermon/PDF/ebook/document/study/workbook/devotional/article/external link/YouTube/event recording/live replay/image/teaching notes), `tags`, `visibility` (`PUBLIC`/`MEMBERS`/`STUDENTS`/`LEADERS`, gated via `lib/resource-labels.ts#canViewResource`), optional `speaker`/`program` connections, `mediaAsset` or `externalUrl`, self-referential `relatedTo`, `createdBy`, `viewCount`.
- **Giving**: `Transaction`.
- **Ops**: `Announcement`.

Design choices:
- `User.stage` (`PLANTED..SENT`) is the literal transformation-pathway pointer — computed/advanced server-side when a stage's courses are completed, not client-editable except by an admin override.
- Streaks are **derived**, not stored: computed from `LessonProgress.completedAt` / `JournalEntry.createdAt` timestamps at read time, so there's no counter to keep in sync or drift.
- `ReflectionEntry.answers` is `Json` keyed by question index/text — the three guided prompts are stored on `Lesson.reflectionQuestions` (`String[]`) so they can change per lesson without a migration.
- Enums model everything that's a closed set (`Role`, `Stage`, `ResourceCategory`, `ResourceType`, `ResourceVisibility`, etc.) for query-ability and referential integrity vs. free-text strings. Permissions are the one deliberately data-driven exception (see RBAC above).

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
  /(admin)/admin   admin dashboard — courses, resources, media, cohorts, users, announcements, settings/roles
  /api/auth/[...nextauth]
  /api/webhooks/stripe
  /api/media/[...key]   R2 signed-proxy fallback (see Media & storage pipeline)
/components
  /ui              shadcn primitives + KTC theming
  /marketing /lms /dashboard /community /admin   feature components
/lib               auth.ts, prisma.ts, rbac.ts, permissions.ts, r2.ts, stripe.ts, stage.ts, streak.ts, photography.ts
/prisma            schema.prisma, migrations/, seed.ts
/docs              this document and its siblings
```

## Extending a scaffolded module

Scaffolded modules (deep Instructor/Mentor dashboards, assignment-submission capture, saved/bookmarked resources, recurring giving — see `ROADMAP.md`) already have the data model in place or a clear extension point. To deepen one: add the feature components under its `components/<area>` folder, add Server Actions colocated with the route, and reuse the RBAC/permission/streak/stage helpers in `lib/` rather than re-deriving them.
