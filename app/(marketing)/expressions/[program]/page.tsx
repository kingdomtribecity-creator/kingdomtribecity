import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CourseCard } from "@/components/marketing/course-card";
import { PathwayStrip } from "@/components/marketing/pathway-strip";
import { BRAND_GRADIENT } from "@/lib/gradients";
import { PROGRAM_PHOTO, PHOTOGRAPHY } from "@/lib/photography";
import { CalendarDays } from "lucide-react";

/**
 * Fully dynamic — any Program row (existing or freshly created by an admin
 * at /admin/programs) automatically gets this Hub page. No hardcoded
 * program list. This is the digital home of the Expression: a visitor
 * lands here first and chooses a course, rather than being dropped
 * straight into one.
 */
export default async function ExpressionHubPage({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program: programSlug } = await params;

  const program = await prisma.program.findUnique({
    where: { slug: programSlug },
    include: {
      featuredCourse: true,
      faqs: { orderBy: { order: "asc" } },
      courses: { where: { status: "PUBLISHED" }, orderBy: { order: "asc" }, include: { program: true } },
      featuredCourses: {
        include: { course: { include: { program: true } } },
      },
      events: { where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 4 },
      featuredEvents: { include: { event: true } },
      resources: { where: { published: true }, take: 6, orderBy: { createdAt: "desc" } },
      featuredResources: { include: { resource: true } },
      testimonies: { where: { approved: true }, take: 4, orderBy: { createdAt: "desc" }, include: { user: true } },
    },
  });
  if (!program || !program.published) notFound();

  // Owning ∪ featured, deduped by id — the same course can be surfaced by
  // multiple Expressions without ever being duplicated in the database.
  const courseMap = new Map(program.courses.map((c) => [c.id, c]));
  for (const f of program.featuredCourses) {
    if (f.course.status === "PUBLISHED") courseMap.set(f.course.id, f.course);
  }
  const courses = [...courseMap.values()];
  const courseIds = courses.map((c) => c.id);

  const eventMap = new Map(program.events.map((e) => [e.id, e]));
  for (const f of program.featuredEvents) {
    if (f.event.startsAt >= new Date()) eventMap.set(f.event.id, f.event);
  }
  const events = [...eventMap.values()].slice(0, 4);

  const resourceMap = new Map(program.resources.map((r) => [r.id, r]));
  for (const f of program.featuredResources) resourceMap.set(f.resource.id, f.resource);
  const resources = [...resourceMap.values()].slice(0, 6);

  const featuredCourse =
    program.featuredCourse && program.featuredCourse.status === "PUBLISHED"
      ? program.featuredCourse
      : courses[0];

  const [mentorLinks, cohorts, fallbackTestimonies] = await Promise.all([
    courseIds.length > 0
      ? prisma.courseMentor.findMany({
          where: { courseId: { in: courseIds } },
          include: { user: { select: { id: true, name: true } } },
        })
      : Promise.resolve([]),
    courseIds.length > 0
      ? prisma.cohort.findMany({
          where: { courseId: { in: courseIds }, status: { in: ["ACTIVE", "UPCOMING"] } },
          include: { course: { select: { title: true, slug: true } } },
          orderBy: { startDate: "asc" },
          take: 4,
        })
      : Promise.resolve([]),
    program.testimonies.length === 0
      ? prisma.testimony.findMany({
          where: { approved: true, featured: true },
          take: 3,
          orderBy: { createdAt: "desc" },
          include: { user: true },
        })
      : Promise.resolve([]),
  ]);

  const mentors = [...new Map(mentorLinks.map((m) => [m.user.id, m.user])).values()];
  const testimonials = program.testimonies.length > 0 ? program.testimonies : fallbackTestimonies;

  return (
    <div>
      {/* Hero */}
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
          {featuredCourse && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link href={`/learn/${featuredCourse.slug}`}>Enrol in {featuredCourse.title}</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        {/* Vision */}
        <section>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Vision</p>
          <p className="mt-3 text-lg leading-relaxed">{program.visionBody ?? program.tagline}</p>
        </section>

        {/* Overview */}
        <section className="mt-12">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Overview</p>
          <p className="mt-3 leading-relaxed text-muted-foreground">{program.description}</p>
        </section>

        {/* Transformation Pathway — the same universal pathway every Expression walks. */}
        <section className="mt-12">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Transformation pathway
          </p>
          <PathwayStrip className="mt-6" />
        </section>

        {/* Featured Course */}
        {featuredCourse && (
          <section className="mt-14">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Featured course
            </p>
            <Link href={`/learn/${featuredCourse.slug}`} className="mt-4 block">
              <Card className="border-border/60 transition-colors hover:border-primary/40">
                <CardContent className="p-6 sm:p-8">
                  <p className="font-heading text-2xl font-medium">{featuredCourse.title}</p>
                  {featuredCourse.subtitle && (
                    <p className="mt-2 text-muted-foreground">{featuredCourse.subtitle}</p>
                  )}
                  <Button className="mt-5" asChild>
                    <span>View course</span>
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </section>
        )}

        {/* All courses in this Expression */}
        {courses.length > 1 && (
          <section className="mt-14">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Courses in {program.name}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} programName={program.name} />
              ))}
            </div>
          </section>
        )}

        {/* Current cohorts */}
        <section className="mt-14">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Current cohorts
          </p>
          <div className="mt-4 space-y-3">
            {cohorts.map((cohort) => (
              <div key={cohort.id} className="flex items-center justify-between rounded-lg border border-border/60 p-4">
                <div>
                  <p className="font-medium">{cohort.name}</p>
                  <p className="text-sm text-muted-foreground">{cohort.course.title}</p>
                </div>
                <Badge variant={cohort.status === "ACTIVE" ? "default" : "secondary"}>
                  {cohort.status === "ACTIVE" ? "Active" : "Upcoming"}
                </Badge>
              </div>
            ))}
            {cohorts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No open cohorts right now — check back soon.
              </p>
            )}
          </div>
        </section>

        {/* Mentors */}
        {mentors.length > 0 && (
          <section className="mt-14">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Mentors
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              {mentors.map((mentor) => (
                <div key={mentor.id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{mentor.name?.[0] ?? "?"}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium">{mentor.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related resources */}
        {resources.length > 0 && (
          <section className="mt-14">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Related resources
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {resources.map((resource) => (
                <Link key={resource.id} href={`/resources/${resource.slug}`}>
                  <Card className="h-full border-border/60 transition-colors hover:border-primary/40">
                    <CardContent className="p-4">
                      <p className="font-medium">{resource.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {resource.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming events */}
        <section className="mt-14">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Upcoming
          </p>
          <div className="mt-4 space-y-3">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <Card className="border-border/60 transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                      <p className="font-medium">{event.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {event.startsAt.toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No upcoming events yet — check back soon.
              </p>
            )}
          </div>
        </section>

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <section className="mt-14">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Stories from {program.name}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {testimonials.map((t) => (
                <Card key={t.id} className="border-border/60">
                  <CardContent className="p-6">
                    <p className="font-heading text-lg">&ldquo;{t.title}&rdquo;</p>
                    <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
                    <p className="mt-3 text-xs font-medium">— {t.user.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        {program.faqs.length > 0 && (
          <section className="mt-14">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Frequently asked questions
            </p>
            <div className="mt-4 space-y-2">
              {program.faqs.map((faq) => (
                <details key={faq.id} className="rounded-lg border border-border/60 p-4">
                  <summary className="cursor-pointer font-medium">{faq.question}</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Enroll / involvement CTA */}
        <section className="mt-16 flex flex-wrap gap-3 border-t border-border/60 pt-10">
          {featuredCourse ? (
            <Button size="lg" asChild>
              <Link href={`/learn/${featuredCourse.slug}`}>Enrol in {program.name}</Link>
            </Button>
          ) : (
            <Button size="lg" asChild>
              <Link href="/sign-up">Get involved</Link>
            </Button>
          )}
          <Button size="lg" variant="outline" asChild>
            <Link href="/resources">Browse resources</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
