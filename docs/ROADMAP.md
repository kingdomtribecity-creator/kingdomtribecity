# Roadmap

## Phase 1 — Founding build (deep)

- Public marketing site (all sections from the PRD), now with curated photography (`lib/photography.ts`)
- Auth: sign-up, sign-in, onboarding
- Planted & Rooted LMS (superseded in Phase 3 by Rooted and Built, see below): 3 courses (Planted, Rooted, Formed) with modules/lessons, full Teaching → Scripture → Reflection → Assignment → Journal flow, progress tracking, certificate on course completion
- Personal Growth Dashboard: stage pathway, per-track status, streak, continue-learning, journal
- Community: one Cohort ("Planted and Rooted Cohort One", renamed in Phase 3) with three Tribes (Deborah, Daniel, Esther) — discussion feed, prayer requests, mentor view
- Admin dashboard: Users, Courses/Modules/Lessons CRUD, Cohorts/Tribes/Mentors, Announcements, analytics overview

## Phase 2 — RBAC, content engine & storage foundation (deep)

- **Scalable RBAC**: 8 roles (`SUPER_ADMIN`, `ADMIN`, `MINISTRY_LEADER`, `INSTRUCTOR`, `MENTOR`, `STUDENT`, `MEMBER`, `GUEST`) with a data-driven `Permission`/`RolePermission` system, editable at `/admin/settings/roles` with no redeploy. See `docs/ARCHITECTURE.md`.
- **Cloudflare R2 media pipeline**: presigned direct-to-bucket uploads, generic `MediaAsset` library (`/admin/media`), signed-proxy serving fallback for private buckets (`/api/media/[...key]`).
- **Expanded content model**: `Resource` now covers the full taxonomy (video/audio/sermon/PDF/ebook/document/study/workbook/devotional/article/external link/YouTube/event recording/live replay/image/teaching notes), with tags, visibility tiers, speaker/program connections, and related-resources — full CRUD at `/admin/resources`, built end-to-end through the R2 pipeline.
- **Instructor role wired into the existing admin**: reuses the admin course editor (no parallel UI), scoped to courses/resources the instructor authored (`Course.authorId`, `Resource.createdById`).
- **Curated photography**: real, hand-picked Unsplash imagery on the homepage, `/programs`, and course heroes, replaceable with R2-hosted originals with no code change (`lib/photography.ts`).

## Phase 3 — Dynamic course engine, paid courses & quizzes (deep)

- **Dynamic Course Engine**: `Program.slug` is a plain string (not an enum), so admins create unlimited programs, courses, modules, and lessons from `/admin/programs` and `/admin/courses` with no code changes or migrations. Course builder covers category, difficulty, duration, start/end dates, format (self-paced/cohort-based/challenge/intensive/certification), access level, pricing, instructor, mentors, and certificate eligibility. Course status moves through Draft → Review → Published → Archived.
- **Rooted and Built**: the flagship course renamed from Planted & Rooted and restructured from 3 separate courses into 1 course with 4 modules — Identity (Planted), Relationship with God (Rooted), Formation (Formed), Kingdom Assignment (Fruitful) — proving the universal Planted → Rooted → Formed → Fruitful → Sent pathway is driven by `Module.stage`, not by any single course.
- **Course-scoped cohorts**: `Cohort.courseId` is required — any course can run multiple cohorts, each with its own timeline, mentors/tribes, and status (Upcoming/Active/Completed). `/admin/cohorts` is now a cross-course index; cohorts are created from a course's own edit page.
- **Reusable content library**: `LessonResource` lets one uploaded `Resource` attach to lessons across many courses without re-uploading.
- **Quizzes**: per-lesson quiz builder (admin) and a graded quiz step in the student lesson stepper — grading and correct answers stay server-side only.
- **Paid courses**: Stripe Checkout extended beyond giving to course purchases (`Enrollment.paymentStatus`), gating lesson access until payment clears.
- A second seeded course (`Kingdom Leaders Intensive`, authored by the demo Instructor) demonstrates multi-program dynamism, instructor scoping, and paid pricing together.

## Scaffolded (schema-complete, minimal UI — extend when prioritized)

- **Young & Yielded / Kingdom Warrior Woman / Kingdom Leaders** — `app/(marketing)/expressions/[program]` renders program hero + its events/resources from the shared `Program`/`Event`/`Resource` models; no program-specific UI yet.
- **Events system** — list + detail + registration works end-to-end; no reminders/calendar sync; recordings field exists but no upload pipeline (could now reuse the R2 uploader built in Phase 2).
- **Giving** — Stripe Checkout wired for one-time test-mode payment and `Transaction` persistence via webhook; recurring billing and fund designations are modeled in the schema but not exposed in the UI.
- **Testimonies** — model + admin approval flag exist; public `/testimonies` page reads approved ones; no submission form yet.

## Deferred from Phase 2 (raised in the same request, intentionally scoped out)

- **Dedicated Mentor dashboard** — today mentors use the same Tribe page as students, with a moderation affordance. A real cross-Tribe mentor view (multiple tribes, reports, lightweight messaging) is still open.
- **Dedicated Instructor dashboard** — deliberately deferred in favor of reusing the scoped admin course editor this phase; a purpose-built teaching-analytics view is a future upgrade if instructors outgrow the admin reuse.
- **Assignment submission capture & review** — the lesson stepper's Assignment step is currently a self-attested checkbox, not a real submission. Capturing actual text/file submissions (a new `AssignmentSubmission` model) and a mentor/instructor review + feedback UI is the natural next step and would unlock the "review submissions" / "feedback system" requirements.
- **Saved/bookmarked resources** on the student dashboard.
- **Content performance analytics** beyond the basic `Resource.viewCount` now being tracked — no dashboard surfaces it yet.

## Explicitly out of scope

- Native mobile apps
- i18n/localization
- Custom video/streaming infrastructure (lessons and resources embed hosted video URLs or R2-hosted files, not a custom transcoding/streaming pipeline)
- Push notifications / email digest automation

## Suggested next milestones

1. Assignment submission model + mentor/instructor review UI (unlocks two deferred items at once).
2. Build out one full "Expression" (start with Young & Yielded — highest community-building upside) to the same depth as Rooted and Built.
3. Recurring giving + designation picker in the `/give` flow.
4. Dedicated Mentor dashboard: cross-Tribe view, reports, lightweight messaging.
5. Testimony submission + moderation queue in Admin.
6. Once `R2_PUBLIC_URL` (custom domain or R2.dev) is configured, verify the pipeline switches over automatically and consider adding a CDN cache layer for large video delivery.
