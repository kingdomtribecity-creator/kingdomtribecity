import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PathwayStrip } from "@/components/marketing/pathway-strip";
import { ExpressionCard } from "@/components/marketing/expression-card";
import { BRAND_GRADIENT } from "@/lib/gradients";
import { PHOTOGRAPHY } from "@/lib/photography";
import { ArrowRight, Megaphone } from "lucide-react";

export default async function HomePage() {
  const [programs, testimonies, upcomingEvent, announcements] = await Promise.all([
    prisma.program.findMany({ where: { published: true }, orderBy: { name: "asc" } }),
    prisma.testimony.findMany({
      where: { approved: true, featured: true },
      take: 2,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
    prisma.event.findFirst({
      where: { startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.announcement.findMany({
      where: { published: true, cohortId: null },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 1,
    }),
  ]);

  return (
    <div>
      {/* Kingdom Pulse */}
      {announcements.length > 0 && (
        <div className="border-b border-border/60 bg-primary/5">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
            <Megaphone className="size-4 shrink-0 text-primary" />
            <p className="text-sm">
              <span className="mr-2 text-xs font-medium uppercase tracking-[0.15em] text-primary">
                Kingdom Pulse
              </span>
              <span className="font-medium">{announcements[0].title}</span>{" "}
              <span className="text-muted-foreground">{announcements[0].body}</span>
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden text-white">
        <Image
          src={PHOTOGRAPHY.worship}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundImage: BRAND_GRADIENT, opacity: 0.82 }} />
        <div className="relative mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">
            A Kingdom movement
          </p>
          <h1 className="mt-6 max-w-3xl font-heading text-4xl font-semibold leading-tight sm:text-6xl">
            The operating system for spiritual formation.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/85">
            Kingdom Tribe City plants, roots, forms, and sends Kingdom
            Ambassadors — believers carrying the nature of Christ into every
            sphere of influence: family, business, government, media,
            technology, and beyond.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/sign-up">
                Start Your Journey <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/vision">Our Vision</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-heading text-3xl font-semibold sm:text-4xl">
            Before you build externally, God builds internally.
          </h2>
          <p className="mt-4 text-muted-foreground">
            God plants people, roots them, forms them, and releases them to
            bear fruit. Kingdom Tribe City exists to give that internal work
            structure, community, and momentum — walking every believer
            through a single, coherent pathway.
          </p>
        </div>
        <PathwayStrip className="mt-14" />
      </section>

      {/* Programs */}
      <section className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-heading text-3xl font-semibold">
              One city, many expressions
            </h2>
            <Link
              href="/expressions"
              className="hidden shrink-0 text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              View all expressions →
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {programs.map((program) => (
              <Link key={program.id} href={`/expressions/${program.slug}`}>
                <ExpressionCard program={program} compact />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image
              src={PHOTOGRAPHY.community}
              alt="Members of a Kingdom Tribe City Tribe gathered in discussion"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              A family, not a crowd
            </p>
            <h2 className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">
              You don&apos;t walk this alone.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every member is planted in a Tribe — a small, accountable
              community inside a cohort, led by a mentor who knows your name.
              Discussion, prayer, and testimony happen there every week, not
              just on a screen.
            </p>
            <Button className="mt-6" variant="outline" asChild>
              <Link href="/sign-up">Find your Tribe</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonies */}
      {testimonies.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="font-heading text-3xl font-semibold">Stories of transformation</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {testimonies.map((t) => (
              <Card key={t.id} className="border-border/60">
                <CardContent className="p-8">
                  <p className="font-heading text-xl">&ldquo;{t.title}&rdquo;</p>
                  <p className="mt-3 text-muted-foreground">{t.body}</p>
                  <p className="mt-5 text-sm font-medium">— {t.user.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/testimonies" className="text-sm text-muted-foreground hover:text-foreground">
              Read more stories →
            </Link>
          </div>
        </section>
      )}

      {/* Event teaser */}
      {upcomingEvent && (
        <section className="border-y border-border/60 bg-secondary/30">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:flex-row sm:items-center sm:px-6">
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="mt-1 font-heading text-2xl font-medium">{upcomingEvent.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {upcomingEvent.startsAt.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
                {upcomingEvent.location ? ` · ${upcomingEvent.location}` : ""}
              </p>
            </div>
            <Button asChild>
              <Link href={`/events/${upcomingEvent.slug}`}>View event</Link>
            </Button>
          </div>
        </section>
      )}

      {/* Partnership CTA */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h2 className="font-heading text-3xl font-semibold sm:text-4xl">
          Help raise a generation of Kingdom Ambassadors.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Your partnership plants, roots, forms, and sends believers into
          every sphere of society.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/give">Give</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/sign-up">Join the movement</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
