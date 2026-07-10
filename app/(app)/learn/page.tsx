import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { stageGradient } from "@/lib/gradients";
import { STAGE_META } from "@/lib/stage";

export const metadata: Metadata = { title: "Learn" };

export default async function LearnCatalogPage() {
  const user = await requireUser();

  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    include: {
      modules: { include: { lessons: true } },
      enrollments: { where: { userId: user.id } },
    },
  });

  const completedLessonIds = new Set(
    (
      await prisma.lessonProgress.findMany({
        where: { userId: user.id, status: "COMPLETED" },
        select: { lessonId: true },
      })
    ).map((p) => p.lessonId)
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold">Planted & Rooted</h1>
      <p className="mt-2 text-muted-foreground">
        The flagship discipleship school — every course walks you further
        along the pathway.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const totalLessons = course.modules.reduce((n, m) => n + m.lessons.length, 0);
          const completed = course.modules
            .flatMap((m) => m.lessons)
            .filter((l) => completedLessonIds.has(l.id)).length;
          const enrolled = course.enrollments.length > 0;
          const pct = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

          return (
            <Link key={course.id} href={`/learn/${course.slug}`}>
              <Card className="h-full overflow-hidden border-border/60 py-0 transition-colors hover:border-primary/40">
                <div
                  className="flex h-28 items-end p-4"
                  style={{ backgroundImage: stageGradient(course.stage) }}
                >
                  <Badge variant="secondary" className="bg-white/15 text-white">
                    {STAGE_META[course.stage].label}
                  </Badge>
                </div>
                <CardContent className="p-6">
                  <p className="font-heading text-lg font-medium">{course.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{course.subtitle}</p>
                  {enrolled ? (
                    <div className="mt-4 space-y-1.5">
                      <Progress value={pct} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">
                        {completed}/{totalLessons} lessons complete
                      </p>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-muted-foreground">
                      {totalLessons} lesson{totalLessons === 1 ? "" : "s"}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
