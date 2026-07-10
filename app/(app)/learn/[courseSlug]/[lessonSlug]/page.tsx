import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { LessonStepper } from "@/components/lms/lesson-stepper";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}) {
  const { courseSlug, lessonSlug } = await params;
  const user = await requireUser();

  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      enrollments: { where: { userId: user.id } },
      modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } },
    },
  });
  if (!course) notFound();
  if (course.enrollments.length === 0) redirect(`/learn/${courseSlug}`);

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const lessonIndex = allLessons.findIndex((l) => l.slug === lessonSlug);
  if (lessonIndex === -1) notFound();
  const lesson = allLessons[lessonIndex];
  const nextLesson = allLessons[lessonIndex + 1] ?? null;

  const [progress, reflection] = await Promise.all([
    prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    }),
    prisma.reflectionEntry.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm text-muted-foreground">
        {course.title} · Lesson {lessonIndex + 1} of {allLessons.length}
      </p>
      <h1 className="mt-2 font-heading text-3xl font-semibold">{lesson.title}</h1>

      <div className="mt-8">
        <LessonStepper
          lesson={lesson}
          progress={progress}
          initialAnswers={
            reflection?.answers ? (reflection.answers as Record<string, string>) : null
          }
          nextLessonHref={nextLesson ? `/learn/${course.slug}/${nextLesson.slug}` : null}
          courseHref={`/learn/${course.slug}`}
        />
      </div>
    </div>
  );
}
