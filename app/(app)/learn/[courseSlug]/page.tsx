import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { CourseHero } from "@/components/lms/course-hero";
import { PurchaseCourseButton } from "@/components/lms/purchase-course-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Award, Lock } from "lucide-react";
import { enrollInCourseAction } from "@/lib/actions/lms";
import { stripeConfigured } from "@/lib/stripe";
import { isIntegrationEnabled } from "@/lib/integrations";
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
      program: true,
      modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } },
      enrollments: { where: { userId: user.id } },
      certificates: { where: { userId: user.id } },
    },
  });
  if (!course || course.status !== "PUBLISHED") notFound();

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const progress = await prisma.lessonProgress.findMany({
    where: { userId: user.id, lessonId: { in: allLessons.map((l) => l.id) } },
  });
  const progressByLesson = new Map(progress.map((p) => [p.lessonId, p]));

  const enrollment = course.enrollments[0];
  const isEnrolled = Boolean(enrollment);
  const isPaidCourse = course.pricingType === "PAID";
  const hasAccess = !isPaidCourse || enrollment?.paymentStatus === "PAID";
  const isCertified = course.certificates.length > 0;
  const firstIncomplete = allLessons.find(
    (l) => progressByLesson.get(l.id)?.status !== "COMPLETED"
  );
  const enrollAction = enrollInCourseAction.bind(null, course.id);
  const paystackEnabled = isPaidCourse && !hasAccess
    ? await isIntegrationEnabled("PAYMENTS", "paystack")
    : false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <CourseHero
        title={course.title}
        subtitle={course.subtitle}
        stage={course.stage}
        coverImage={course.coverImage}
        programName={course.program.name}
      />

      <p className="mt-8 text-muted-foreground">{course.description}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {isPaidCourse && !hasAccess ? (
          <PurchaseCourseButton
            courseId={course.id}
            priceCents={course.priceCents ?? 0}
            stripeEnabled={stripeConfigured}
            paystackEnabled={paystackEnabled}
          />
        ) : !isEnrolled ? (
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
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              Module {mi + 1} · {mod.title}
              {mod.stage && <Badge variant="outline">{mod.stage}</Badge>}
            </p>
            <div className="mt-3 divide-y divide-border rounded-lg border border-border/60">
              {mod.lessons.map((lesson) => {
                const status = progressByLesson.get(lesson.id)?.status ?? "NOT_STARTED";
                const done = status === "COMPLETED";
                const inner = (
                  <div className="flex items-center gap-3 p-4">
                    {!hasAccess ? (
                      <Lock className="size-5 shrink-0 text-muted-foreground/40" />
                    ) : done ? (
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
                return isEnrolled && hasAccess ? (
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
