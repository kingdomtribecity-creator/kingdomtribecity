import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { computeStreak } from "@/lib/streak";
import { STAGE_META } from "@/lib/stage";
import { TRACK_COURSE_SLUG, deriveTrackStatus, type TrackStatus } from "@/lib/tracks";
import { StagePathway } from "@/components/dashboard/stage-pathway";
import { StreakBadge } from "@/components/dashboard/streak-badge";
import { JournalPanel } from "@/components/dashboard/journal-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const TRACK_STATUS_STYLE: Record<TrackStatus, string> = {
  Completed: "text-growth",
  "In Progress": "text-primary",
  Growing: "text-primary/80",
  Upcoming: "text-muted-foreground",
};

export default async function DashboardPage() {
  const user = await requireUser();

  const [enrollments, allProgress, journalEntries, upcomingRegistrations] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          include: { modules: { include: { lessons: true } } },
        },
      },
    }),
    prisma.lessonProgress.findMany({ where: { userId: user.id } }),
    prisma.journalEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { lesson: { select: { title: true } } },
    }),
    prisma.eventRegistration.findMany({
      where: { userId: user.id, event: { startsAt: { gte: new Date() } } },
      include: { event: true },
      orderBy: { event: { startsAt: "asc" } },
      take: 3,
    }),
  ]);

  const progressByLesson = new Map(allProgress.map((p) => [p.lessonId, p]));

  const streak = computeStreak([
    ...allProgress.filter((p) => p.completedAt).map((p) => p.completedAt!),
    ...journalEntries.map((j) => j.createdAt),
  ]);

  // Continue learning: first incomplete lesson, preferring the course matching the user's stage.
  const sortedEnrollments = [...enrollments].sort((a, b) => {
    if (a.course.stage === user.stage && b.course.stage !== user.stage) return -1;
    if (b.course.stage === user.stage && a.course.stage !== user.stage) return 1;
    return 0;
  });

  let continueLearning: { courseSlug: string; courseTitle: string; lessonSlug: string; lessonTitle: string } | null = null;
  for (const enrollment of sortedEnrollments) {
    const lessons = enrollment.course.modules.flatMap((m) => m.lessons);
    const next = lessons.find((l) => progressByLesson.get(l.id)?.status !== "COMPLETED");
    if (next) {
      continueLearning = {
        courseSlug: enrollment.course.slug,
        courseTitle: enrollment.course.title,
        lessonSlug: next.slug,
        lessonTitle: next.title,
      };
      break;
    }
  }

  const enrollmentByCourseSlug = new Map(enrollments.map((e) => [e.course.slug, e]));
  const tracks = Object.entries(TRACK_COURSE_SLUG).map(([track, courseSlug]) => {
    if (!courseSlug) {
      return { track, status: "Upcoming" as TrackStatus };
    }
    const enrollment = enrollmentByCourseSlug.get(courseSlug);
    const lessons = enrollment?.course.modules.flatMap((m) => m.lessons) ?? [];
    const completed = lessons.filter((l) => progressByLesson.get(l.id)?.status === "COMPLETED").length;
    return {
      track,
      status: deriveTrackStatus(enrollment, completed, lessons.length),
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="font-heading text-3xl font-semibold">{user.name}</h1>
        </div>
        <StreakBadge streak={streak} />
      </div>

      <Card className="mt-8 border-border/60">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current stage</p>
              <p className="font-heading text-2xl font-semibold">{STAGE_META[user.stage].label}</p>
              <p className="text-sm text-muted-foreground">{STAGE_META[user.stage].question}</p>
            </div>
          </div>
          <StagePathway stage={user.stage} />
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Continue learning</p>
              {continueLearning ? (
                <>
                  <p className="mt-2 font-heading text-xl font-medium">{continueLearning.lessonTitle}</p>
                  <p className="text-sm text-muted-foreground">{continueLearning.courseTitle}</p>
                  <Button className="mt-4" asChild>
                    <Link href={`/learn/${continueLearning.courseSlug}/${continueLearning.lessonSlug}`}>
                      Continue <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="mt-2 text-muted-foreground">
                    You&apos;re not enrolled in a course yet.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/learn">Browse courses</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Growth journey</p>
              <div className="mt-4 divide-y divide-border">
                {tracks.map(({ track, status }) => (
                  <div key={track} className="flex items-center justify-between py-3">
                    <p className="text-sm">{track}</p>
                    <span className={cn("text-sm font-medium", TRACK_STATUS_STYLE[status])}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Spiritual journal</p>
              <div className="mt-4">
                <JournalPanel entries={journalEntries} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
              <div className="mt-4 space-y-3">
                {upcomingRegistrations.map((r) => (
                  <Link
                    key={r.id}
                    href={`/events/${r.event.slug}`}
                    className="flex items-start gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:border-primary/40"
                  >
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{r.event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.event.startsAt.toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
                {upcomingRegistrations.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No upcoming events yet.{" "}
                    <Link href="/events" className="underline underline-offset-4">
                      Browse events
                    </Link>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Explore resources</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Teachings and studies picked for where you are right now.
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/resources">
                  Resource Library <Badge variant="secondary" className="ml-1">New</Badge>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
