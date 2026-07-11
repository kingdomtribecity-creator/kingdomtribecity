# Kingdom Tribe City

The operating system for spiritual formation — a platform that plants, roots, forms, and sends Kingdom Ambassadors into every sphere of influence.

Read the founding docs first:

- [`docs/PRD.md`](docs/PRD.md) — product requirements & vision
- [`docs/USER_JOURNEYS.md`](docs/USER_JOURNEYS.md) — key user journeys
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — application & data architecture
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — visual identity & components
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — what's deep vs. scaffolded, and what's next

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 + shadcn/ui (Radix) · Prisma 7 + PostgreSQL · Auth.js v5 · Stripe · Cloudflare R2

## Getting started

1. **Database** — set `DATABASE_URL` in `.env` to a Postgres connection string (a hosted instance like Neon works well; a local Postgres via Docker also works).
2. Install dependencies and set up the schema:

   ```bash
   npm install
   npx prisma migrate dev
   npx prisma db seed
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

### Demo logins

Seeded by `prisma/seed.ts`, password `KingdomDemo!23` for all:

| Email | Role |
|---|---|
| `superadmin@kingdomtribecity.org` | Super Administrator |
| `admin@kingdomtribecity.org` | Administrator |
| `leader@kingdomtribecity.org` | Ministry Leader |
| `instructor@kingdomtribecity.org` | Instructor (owns the "Formed" course) |
| `mentor.deborah@kingdomtribecity.org` | Mentor (Tribe Deborah) |
| `student@kingdomtribecity.org` | Student (mid-course, in Tribe Deborah) |

### Environment variables

See `.env` for the full list. `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` and `R2_*` are optional in development — the `/give` flow and media uploads degrade gracefully with a clear message when they aren't configured.

## Scripts

- `npm run dev` — start the dev server (Turbopack)
- `npm run build` / `npm run start` — production build & serve
- `npm run lint` — ESLint
- `npx prisma studio` — browse the database
