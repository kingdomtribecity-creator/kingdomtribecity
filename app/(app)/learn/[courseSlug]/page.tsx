import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { CourseHero } from "@/components/lms/course-hero";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Award } from "lucide-react";
import { enrollInCourseAction } from "@/lib/actions/lms";
import { cn } from "@/lib/utils";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const user = await requireUser();

  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } },
      enrollments: { where: { userId: user.id } },
      certificates: { where: { userId: user.id } },
    },
  });
  if (!course || !course.published) notFound();

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const progress = await prisma.lessonProgress.findMany({
    where: { userId: user.id, lessonId: { in: allLessons.map((l) => l.id) } },
  });
  const progressByLesson = new Map(progress.map((p) => [p.lessonId, p]));

  const isEnrolled = course.enrollments.length > 0;
  const isCertified = course.certificates.length > 0;
  const firstIncomplete = allLessons.find(
    (l) => progressByLesson.get(l.id)?.status !== "COMPLETED"
  );
  const enrollAction = enrollInCourseAction.bind(null, course.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <CourseHero title={course.title} subtitle={course.subtitle} stage={course.stage} />

      <p className="mt-8 text-muted-foreground">{course.description}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!isEnrolled ? (
          <form action={enrollAction}>
            <Button type="submit">Enroll in this course</Button>
          </form>
        ) : firstIncomplete ? (
          <Button asChild>
            <Link href={`/learn/${course.slug}/${firstIncomplete.slug}`}>
              {progress.length > 0 ? "Continue" : "Begin"} learning
            </Link>
          </Button>
        ) : (
          <p className="flex items-center gap-2 text-sm font-medium text-growth">
            <CheckCircle2 className="size-4" /> Course complete
          </p>
        )}
        {isCertified && (
          <Button variant="outline" asChild>
            <Link href={`/certificate/${course.certificates[0].serial}`}>
              <Award className="size-4" /> View certificate
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-12 space-y-8">
        {course.modules.map((mod, mi) => (
          <div key={mod.id}>
            <p className="text-sm font-medium text-muted-foreground">
              Module {mi + 1} · {mod.title}
            </p>
            <div className="mt-3 divide-y divide-border rounded-lg border border-border/60">
              {mod.lessons.map((lesson) => {
                const status = progressByLesson.get(lesson.id)?.status ?? "NOT_STARTED";
                const done = status === "COMPLETED";
                const inner = (
                  <div className="flex items-center gap-3 p-4">
                    {done ? (
                      <CheckCircle2 className="size-5 shrink-0 text-growth" />
                    ) : (
                      <Circle className="size-5 shrink-0 text-muted-foreground/40" />
                    )}
                    <div className="min-w-0">
                      <p className={cn("font-medium", done && "text-muted-foreground")}>
                        {lesson.title}
                      </p>
                      {lesson.summary && (
                        <p className="truncate text-sm text-muted-foreground">{lesson.summary}</p>
                      )}
                    </div>
                  </div>
                );
                return isEnrolled ? (
                  <Link
                    key={lesson.id}
                    href={`/learn/${course.slug}/${lesson.slug}`}
                    className="block transition-colors hover:bg-secondary/50"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={lesson.id} className="opacity-70">
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
