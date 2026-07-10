# Roadmap

## This build (deep)

- Public marketing site (all sections from the PRD)
- Auth: sign-up, sign-in, onboarding, RBAC (`GUEST/STUDENT/MENTOR/ADMIN`)
- Planted & Rooted LMS: 3 courses (Planted, Rooted, Formed) with modules/lessons, full Teaching → Scripture → Reflection → Assignment → Journal flow, progress tracking, certificate on course completion
- Personal Growth Dashboard: stage pathway, per-track status, streak, continue-learning, journal, saved teachings
- Community: one Cohort ("Planted and Rooted Cohort One") with three Tribes (Deborah, Daniel, Esther) — discussion feed, prayer requests, mentor view
- Admin dashboard: Users, Courses/Modules/Lessons CRUD, Cohorts/Tribes/Mentors, Announcements, analytics overview

## Scaffolded (schema-complete, minimal UI — extend when prioritized)

- **Young & Yielded / Kingdom Warrior Woman / Kingdom Leaders** — `app/(app)/expressions/[program]` renders program hero + its events/resources from the shared `Program`/`Event`/`Resource` models; no program-specific UI yet.
- **Events system** — list + detail + registration works end-to-end; no reminders/calendar sync; recordings field exists but no upload pipeline.
- **Resource library** — categorized list + detail works; `mediaUrl` is a plain URL field, no upload/CDN pipeline.
- **Giving** — Stripe Checkout wired for one-time test-mode payment and `Transaction` persistence via webhook; recurring billing and fund designations are modeled in the schema but not exposed in the UI.
- **Mentor tooling** — Tribe view surfaces member list/progress; no dedicated mentor analytics or messaging yet.
- **Testimonies** — model + admin approval flag exist; public `/testimonies` page reads approved ones; no submission form yet.

## Explicitly out of scope this phase

- Native mobile apps
- i18n/localization
- Custom video/streaming infrastructure (lessons embed hosted video URLs)
- Push notifications / email digest automation

## Suggested next milestones

1. Build out one full "Expression" (start with Young & Yielded — highest community-building upside) to the same depth as Planted & Rooted.
2. Resource upload pipeline (S3/R2 + signed URLs) to replace plain `mediaUrl`.
3. Recurring giving + designation picker in the `/give` flow.
4. Mentor dashboard: cross-Tribe view for mentors managing multiple tribes, lightweight messaging.
5. Testimony submission + moderation queue in Admin.
