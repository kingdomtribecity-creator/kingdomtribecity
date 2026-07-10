# User Journey Map

## 1. Seeker → Signed-up disciple

1. Lands on public site (`/`) — hero communicates movement, family, city, a generation being formed.
2. Explores `/vision`, `/programs`, `/testimonies`.
3. Clicks primary CTA "Start Your Journey" → `/sign-up`.
4. Creates account (email/password or magic link) → `/onboarding`.
5. Onboarding: name, sphere of influence, what brought you here → account created with `stage = PLANTED`.
6. Auto-enrolled in the first Planted & Rooted course; assigned to an open Tribe within the active Cohort.
7. Redirected to `/dashboard` — sees Stage badge (Planted), a "Begin your first lesson" prompt.

## 2. Active student — the core loop

1. Opens `/dashboard` → sees current stage, streak, "Continue Learning" card for their next incomplete lesson.
2. Clicks into `/learn/[courseSlug]/[lessonSlug]`.
3. Moves through the lesson stepper: Teaching → Scripture Meditation → Reflection (answers guided prompts) → Assignment → Journal entry.
4. On completion, `LessonProgress` is marked complete, streak recalculated, dashboard stage/track status updates.
5. When all lessons in the stage's course(s) are complete, the stage advances (e.g. Planted → Rooted) with a celebratory moment.
6. Repeats daily/weekly — streak and dashboard reinforce consistency.

## 3. Community member

1. From dashboard, clicks their Tribe card → `/tribe/[tribeSlug]`.
2. Sees fellow members, mentor, discussion feed, prayer requests.
3. Posts a discussion reply or a prayer request.
4. Sees testimonies shared by tribe members.

## 4. Mentor

1. Signs in with `MENTOR` role → dashboard shows a "Your Tribe" panel in addition to their own personal growth view.
2. Visits `/tribe/[tribeSlug]` with elevated view: sees member progress at a glance, can respond to prayer requests, pin announcements.

## 5. Admin

1. Signs in → `/admin`.
2. Manages Users (role changes, stage overrides), Courses/Modules/Lessons (CRUD), Cohorts/Tribes/Mentors, Announcements.
3. Views Analytics overview: active members, completion rates, stage distribution, event attendance.

## 6. Partner (giving)

1. From `/give` or footer CTA, selects amount and one-time/recurring.
2. Redirected to Stripe Checkout (test mode).
3. Returns to `/give/thank-you`; `Transaction` recorded via Stripe webhook.

## 7. Expression visitor (Young & Yielded / Kingdom Warrior Woman / Kingdom Leaders)

1. From `/expressions/[program]`, sees program-specific hero, upcoming events, resources.
2. Registers for an event or explores program-specific resources.
