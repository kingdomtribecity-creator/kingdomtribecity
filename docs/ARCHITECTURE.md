# Application & Data Architecture

## Stack

- **Next.js 16** (App Router, React Server Components, Server Actions), TypeScript.
- **Tailwind CSS v4** + **shadcn/ui** primitives in `components/ui`.
- **Prisma ORM 7** + **PostgreSQL** (hosted on Neon). Prisma 7 requires a driver adapter for runtime queries — see `lib/prisma.ts`, which uses `@prisma/adapter-pg`. CLI/migrate connection config lives in `prisma.config.ts`.
- **Auth.js v5** (`next-auth`) with the Credentials provider (email + password) and the Prisma adapter, JWT sessions carrying `id`, `role`, `stage`, `onboarded`.
- **Route protection**: `proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`) guards `/dashboard`, `/learn`, `/tribe`, `/admin`. Proxy is a fast, coarse gate only — every server action and route handler re-checks authorization via `lib/rbac.ts`, because proxy coverage can silently drop on refactors.
- **Stripe** and **Paystack** for giving and paid-course checkout (test mode), each with their own webhook (`/api/webhooks/stripe`, `/api/webhooks/paystack`) that branches on a `kind` metadata field to update either a `Transaction` or an `Enrollment`. Stripe is configured via `.env`; Paystack is configured at runtime — see "Admin Integrations" below.
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

## Admin Integrations (runtime-editable secrets)

Unlike Stripe/R2 (env-var, deploy-time), the `Integration` model lets a **Super Admin only** (`requireSuperAdmin()` in `lib/rbac.ts` — the first single-role, non-data-driven gate outside the existing `requireAdmin()`/`requireMentorOrAdmin()` pattern) configure Email (Resend, Gmail), Payments (Paystack), AI (Anthropic, OpenAI), and SMS (Termii) providers from `/admin/settings/integrations`, with changes taking effect immediately — no redeploy.

- **Storage**: one `Integration` row per `(type, provider)`, `config Json` for non-secret fields (from-address, model, currency…) and `secretsEncrypted String?` for API keys, encrypted with AES-256-GCM via `lib/crypto.ts` (key from `INTEGRATIONS_ENCRYPTION_KEY`). Secrets are never sent back to the browser after saving — the settings form always renders blank with a "saved" hint.
- **Exclusivity**: EMAIL and AI are exclusive — enabling one provider disables the others of that type (exactly one active sender/model). PAYMENTS and SMS are not — Stripe and Paystack can both be enabled simultaneously, and calling code (`/give`, course purchase) shows a provider picker only when more than one is actually available.
- **`lib/integrations.ts`** is the read-side API every consumer goes through: `getIntegrationSecrets()` (decrypt, for admin "Test" actions, ignores `enabled`), `getActiveIntegration()` (the one enabled EMAIL/AI row), `getEnabledIntegrations()` / `isIntegrationEnabled()` (PAYMENTS/SMS).
- **Provider wrappers** (`lib/email.ts`, `lib/termii.ts`, `lib/ai-providers.ts`, `lib/paystack.ts`) are thin, stateless functions that take already-decrypted config — they don't know about the `Integration` table themselves, keeping the encryption/storage concern separate from the "how do I call this provider's API" concern.
- **Paystack** mirrors the existing Stripe pattern closely: `initializePaystackTransaction()` returns a hosted checkout URL (like Stripe's Checkout Session `url`), and `/api/webhooks/paystack` verifies `x-paystack-signature` (HMAC-SHA512, key looked up from the DB rather than an env var) and branches on `metadata.kind` exactly like the Stripe webhook. `Transaction`/`Enrollment` both carry a `provider: PaymentProvider` discriminator plus provider-specific reference columns.

## Data model

Full schema in `prisma/schema.prisma`. Grouped by domain:

- **Identity**: `User`, `Account`, `Session`, `VerificationToken` (Auth.js-compatible).
- **Permissions**: `Permission`, `RolePermission`.
- **Media**: `MediaAsset` (R2-backed; `kind` = `VIDEO`/`AUDIO`/`IMAGE`/`DOCUMENT`).
- **LMS**: `Program → Course (authorId?, CourseMentor[]) → Module (stage?) → Lesson`, `LessonResource` (reusable content-library attachments), `Quiz → QuizQuestion → QuizOption`, `QuizAttempt`, `Enrollment` (`cohortId?`, `paymentStatus`), `LessonProgress`, `ReflectionEntry`, `JournalEntry`, `Certificate`.
- **Community**: `Cohort` (required `courseId`, `status`) `→ Tribe → TribeMembership`, `DiscussionPost/Comment`, `PrayerRequest`, `Testimony`.
- **Events**: `Event`, `Speaker`, `EventRegistration`.
- **Resources**: `Resource` — expanded content taxonomy (`ResourceType`: video/audio/sermon/PDF/ebook/document/study/workbook/devotional/article/external link/YouTube/event recording/live replay/image/teaching notes), `tags`, `visibility` (`PUBLIC`/`MEMBERS`/`STUDENTS`/`LEADERS`, gated via `lib/resource-labels.ts#canViewResource`), optional `speaker`/`program` connections, `mediaAsset` or `externalUrl`, self-referential `relatedTo`, `createdBy`, `viewCount`.
- **Giving**: `Transaction`.
- **Ops**: `Announcement`.

Design choices:
- **Dynamic Course Engine**: `Program.slug` is a plain unique `String`, not an enum — admins create new programs from `/admin/programs` with zero migrations. `lib/constants.ts#FLAGSHIP_PROGRAM_SLUG` is the one deliberate, documented product-level constant (which program onboards a brand-new user by default); nothing else in application code names a specific program or course.
- `User.stage` (`PLANTED..SENT`) is the literal transformation-pathway pointer. `Course.stage` is an optional coarse hint (nullable, for single-stage courses); `Module.stage` is the precise driver — a lesson's completion checks whether its `Module.stage` matches the user's current stage and, if so, whether every lesson in that module is now complete, before advancing. This decouples the universal pathway from any one course: a future "School of Prayer" can tag a module `ROOTED` and contribute to the same track. Course completion (all lessons, any stage) separately drives `Enrollment.status`/`Certificate` issuance, gated by `Course.certificateEnabled`.
- **Cohorts belong to a course** (`Cohort.courseId` required) — one course can run many cohorts, each with its own timeline, mentors/tribes, and `CohortStatus` (`UPCOMING`/`ACTIVE`/`COMPLETED`). `Enrollment.cohortId` is optional (self-paced enrollments have none).
- **Content reusability**: `LessonResource` is a join table between `Lesson` and the Phase-2 `Resource` library — one upload attaches to lessons across many courses without re-uploading.
- **Quizzes are graded server-only**: the student-facing lesson query selects `QuizOption.id/label` but never `isCorrect`; grading and `QuizAttempt` creation happen entirely inside `submitQuizAttemptAction` (`lib/actions/lms.ts`).
- Streaks are **derived**, not stored: computed from `LessonProgress.completedAt` / `JournalEntry.createdAt` timestamps at read time, so there's no counter to keep in sync or drift.
- `ReflectionEntry.answers` is `Json` keyed by question index/text — the three guided prompts are stored on `Lesson.reflectionQuestions` (`String[]`) so they can change per lesson without a migration. `Lesson.prayerPrompt` folds the prayer exercise into the same Reflection step rather than a separate pipeline stage.
- Enums model everything that's a closed set (`Role`, `Stage`, `CourseStatus`, `CourseDifficulty`, `CourseFormat`, `CourseAccessLevel`, `PricingType`, `CohortStatus`, `PaymentStatus`, `ResourceCategory`, `ResourceType`, `ResourceVisibility`, etc.) for query-ability and referential integrity vs. free-text strings. `Program.slug` and permissions are the deliberately data-driven exceptions (see RBAC above).

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
