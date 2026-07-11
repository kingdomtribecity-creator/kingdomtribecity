# Kingdom Tribe City — Product Requirements Document

## 1. Vision

**Kingdom Tribe City (KTC) is the operating system for spiritual formation.**

Not a church website. Not a course catalog. A global digital home where believers are planted, rooted, formed, and sent as Kingdom Ambassadors — carrying the nature, wisdom, excellence, and influence of Christ into every sphere: family, healthcare, business, technology, government, education, media, ministry, and nations.

**Core philosophy**: Before people build externally, God builds internally. God plants, roots, forms, and releases people to bear fruit. KTC's job is to give that internal work structure, community, and momentum — at scale, for millions.

## 2. The Transformation Pathway

```
PLANTED → ROOTED → FORMED → FRUITFUL → SENT
```

| Stage | Question it answers | Focus |
|---|---|---|
| **Planted** | Who am I in Christ? | Identity foundation |
| **Rooted** | How do I know Him? | Intimacy — prayer, Word, obedience |
| **Formed** | Who am I becoming? | Character, renewal, discipline, maturity |
| **Fruitful** | What am I made to do? | Purpose, gifts, calling, assignment |
| **Sent** | Where do I carry Him? | Influence in every sphere |

This pathway is not a metaphor confined to marketing copy — it is the literal data model and UX spine of the product. Every user has a `stage`. The dashboard visualizes it as a journey, not a percentage bar.

## 3. Product Principles (the Silicon Valley bar)

1. **Duolingo** — streaks, consistency, milestones, celebration of growth — applied to spiritual disciplines.
2. **MasterClass** — cinematic course pages, instructor/mentor presence, premium storytelling.
3. **Coursera** — structured pathways, modules, completion, certification.
4. **Notion** — clean personal workspace, calm information architecture.
5. **Headspace** — calm, reflective, daily-engagement UX; guided transformation.
6. **Strava** — accountability, visible growth, community motivation.
7. **Circle** — modern cohort/community spaces.
8. **YouVersion** — scripture-centered daily engagement, notes, saved content.
9. **Apple** — simplicity, restraint, every screen intentional.

Nothing ships that would look out of place next to these products.

## 4. Ecosystem Modules

1. **Public website** — storytelling: Vision, Story, Programs, Events, Testimonies, Community, Resources, Partnership.
2. **Dynamic Course Engine** — a general-purpose LMS: admins create unlimited programs, courses, modules, and cohorts from the dashboard with no code changes. **Rooted and Built** is the flagship discipleship school (Identity → Relationship with God → Formation → Kingdom Assignment) — one course among many the engine can host, not something baked into the application.
3. **Personal Growth Dashboard** — the user's spiritual home screen.
4. **Community** — Cohorts (course-scoped) → Tribes, mentors, discussion, prayer requests, testimonies.
5. **KTC Expressions** — Rooted and Built, Young & Yielded (youth), Kingdom Warrior Woman (women), Kingdom Leaders (leadership development) — each an ordinary `Program` row, not a hardcoded route.
6. **Events** — registration, speakers, recordings.
7. **Resource Library** — teachings, sermons, articles, studies, devotionals by category; reusable across any course via lesson↔resource attachments.
8. **Giving & Partnership** — one-time and recurring giving via Stripe, plus paid-course checkout using the same Stripe integration.
9. **Admin/Leadership Dashboard** — users, programs, courses, modules, lessons, quizzes, cohorts, mentors, announcements, analytics.

## 5. The Lesson Experience (key differentiator)

Generic LMS: `Video → Mark Complete → Next`.

KTC lesson flow:

```
Teaching (video/audio)
    ↓
Scripture Meditation
    ↓
Reflection — guided prompts + optional prayer exercise:
    "What is God revealing?"
    "What mindset is changing?"
    "What truth am I embracing?"
    ↓
Quiz (optional, per lesson)
    ↓
Assignment
    ↓
Spiritual Journal entry
    ↓
Growth tracking updates
```

Every lesson produces a written artifact (reflection + journal) the student can revisit — the product remembers their formation, not just their completion. Lessons may also attach reusable resources from the shared content library (video/audio/PDF/ebook/external links/downloadables) so one upload can serve many courses.

## 6. Personal Growth Dashboard

Represents transformation, not percentages:

- Current Stage (badge + pathway visualization)
- Per-track status: Identity / Prayer / Character Formation / Kingdom Assignment — each labeled Completed / Growing / In Progress / Upcoming
- Engagement streak (consecutive days of spiritual activity: lesson, reflection, or journal entry)
- Upcoming sessions / assignments
- Prayer journal
- Saved teachings

## 7. Roles

| Role | Capability |
|---|---|
| `GUEST` | Public site only |
| `MEMBER` | Registered, not yet enrolled — community/content access only |
| `STUDENT` | Enroll, learn, journal, participate in their Tribe |
| `MENTOR` | Student capabilities + view/guide their assigned Tribe |
| `INSTRUCTOR` | Create & manage their own courses and resources |
| `MINISTRY_LEADER` | Manage content, programs, events, cohorts, announcements |
| `ADMIN` | Full platform management, including users and roles |
| `SUPER_ADMIN` | Everything, unconditionally — the one role permissions can't be revoked from |

Which permissions each role grants (beyond the fixed role list itself) is data, not code — editable at `/admin/settings/roles` with no redeploy. RBAC is enforced server-side on every mutation — never trusted from the client. See `ARCHITECTURE.md`.

## 8. Success Metrics (what the Admin analytics overview tracks)

- Active members (30-day)
- Course completion rate
- Assignment/reflection submission rate
- Average stage distribution across the member base
- Event registration & attendance
- Community engagement (posts, prayer requests answered)

## 9. Non-goals (this build phase)

- Native mobile apps (responsive web first)
- Multi-language i18n (architecture should not preclude it later)
- Payment for course access (KTC courses are free; Stripe is for giving only)
- Live video/streaming infrastructure (lessons use hosted video URLs, not a custom video pipeline)

See `ROADMAP.md` for what is deep vs. scaffolded in this build.
