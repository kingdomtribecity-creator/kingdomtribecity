import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { LessonStepper } from "@/components/lms/lesson-stepper";
import { TYPE_LABEL } from "@/lib/resource-labels";
import { FileText } from "lucide-react";

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
  if (course.pricingType === "PAID" && course.enrollments[0].paymentStatus !== "PAID") {
    redirect(`/learn/${courseSlug}`);
  }

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const lessonIndex = allLessons.findIndex((l) => l.slug === lessonSlug);
  if (lessonIndex === -1) notFound();
  const lessonRef = allLessons[lessonIndex];
  const nextLesson = allLessons[lessonIndex + 1] ?? null;

  const [progress, reflection, lesson] = await Promise.all([
    prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lessonRef.id } },
    }),
    prisma.reflectionEntry.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lessonRef.id } },
    }),
    prisma.lesson.findUniqueOrThrow({
      where: { id: lessonRef.id },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: { options: { select: { id: true, label: true } } },
            },
          },
        },
        attachedResources: {
          orderBy: { order: "asc" },
          include: { resource: true },
        },
      },
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
          quiz={lesson.quiz}
          progress={progress}
          initialAnswers={
            reflection?.answers ? (reflection.answers as Record<string, string>) : null
          }
          nextLessonHref={nextLesson ? `/learn/${course.slug}/${nextLesson.slug}` : null}
          courseHref={`/learn/${course.slug}`}
        />
      </div>

      {lesson.attachedResources.length > 0 && (
        <div className="mt-12 border-t border-border pt-6">
          <p className="text-sm font-medium">Resources for this lesson</p>
          <div className="mt-3 space-y-2">
            {lesson.attachedResources.map(({ resource }) => (
              <Link
                key={resource.id}
                href={`/resources/${resource.slug}`}
                className="flex items-center gap-3 rounded-lg border border-border/60 p-3 text-sm transition-colors hover:border-primary/40"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-medium">{resource.title}</span>
                <span className="text-muted-foreground">{TYPE_LABEL[resource.type]}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
