import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BRAND_GRADIENT } from "@/lib/gradients";
import type { ProgramSlug } from "@/lib/generated/prisma/enums";

const SLUG_MAP: Record<string, ProgramSlug> = {
  "young-and-yielded": "YOUNG_AND_YIELDED",
  "kingdom-warrior-woman": "KINGDOM_WARRIOR_WOMAN",
  "kingdom-leaders": "KINGDOM_LEADERS",
  "planted-and-rooted": "PLANTED_AND_ROOTED",
};

export default async function ExpressionPage({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program: programParam } = await params;
  const programSlug = SLUG_MAP[programParam];
  if (!programSlug) notFound();

  const program = await prisma.program.findUnique({
    where: { slug: programSlug },
    include: {
      events: { where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" } },
    },
  });
  if (!program) notFound();

  return (
    <div>
      <section className="text-white" style={{ backgroundImage: BRAND_GRADIENT }}>
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">
            Kingdom Tribe City Expression
          </p>
          <h1 className="mt-6 font-heading text-4xl font-semibold leading-tight sm:text-5xl">
            {program.name}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/85">{program.tagline}</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-lg leading-relaxed text-muted-foreground">{program.description}</p>

        <div className="mt-10">
          <p className="text-sm font-medium">Upcoming</p>
          <div className="mt-3 space-y-3">
            {program.events.map((event) => (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <Card className="border-border/60 transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center justify-between p-4">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.startsAt.toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {program.events.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No upcoming events yet — check back soon.
              </p>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/sign-up">Get involved</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/resources">Browse resources</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
