import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BRAND_GRADIENT } from "@/lib/gradients";
import { PROGRAM_PHOTO, PHOTOGRAPHY } from "@/lib/photography";

/**
 * Fully dynamic — any Program row (existing or freshly created by an admin
 * at /admin/programs) automatically gets this landing page. No hardcoded
 * program list.
 */
export default async function ExpressionPage({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program: programSlug } = await params;

  const program = await prisma.program.findUnique({
    where: { slug: programSlug },
    include: {
      events: { where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" } },
      courses: { where: { status: "PUBLISHED" }, orderBy: { order: "asc" } },
    },
  });
  if (!program || !program.published) notFound();

  return (
    <div>
      <section className="relative overflow-hidden text-white">
        <Image
          src={program.heroImage || PROGRAM_PHOTO[program.slug] || PHOTOGRAPHY.community}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundImage: BRAND_GRADIENT, opacity: 0.82 }} />
        <div className="relative mx-auto max-w-4xl px-4 py-24 sm:px-6">
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

        {program.courses.length > 0 && (
          <div className="mt-10">
            <p className="text-sm font-medium">Courses</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {program.courses.map((course) => (
                <Link key={course.id} href={`/learn/${course.slug}`}>
                  <Card className="h-full border-border/60 transition-colors hover:border-primary/40">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {course.category && <Badge variant="secondary">{course.category}</Badge>}
                        {course.pricingType === "PAID" && (
                          <Badge variant="outline">
                            ${((course.priceCents ?? 0) / 100).toFixed(0)}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 font-medium">{course.title}</p>
                      {course.subtitle && (
                        <p className="mt-1 text-sm text-muted-foreground">{course.subtitle}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

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
