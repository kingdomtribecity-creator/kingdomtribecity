import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  updateCourseAction,
  createModuleAction,
  createLessonAction,
  createCohortAction,
} from "@/lib/actions/admin";
import { requirePermission, ForbiddenError } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { r2Configured } from "@/lib/r2";
import { CourseForm } from "@/components/admin/course-form";
import { ModuleStageSelect } from "@/components/admin/module-stage-select";
import { CohortStatusSelect } from "@/components/admin/cohort-status-select";

export default async function AdminCourseEditPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const user = await requirePermission(PERMISSIONS.CONTENT_MANAGE);

  const [course, programs, people] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } },
        mentors: true,
        cohorts: { orderBy: { startDate: "desc" }, include: { _count: { select: { tribes: true } } } },
      },
    }),
    prisma.program.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: { in: ["INSTRUCTOR", "MENTOR", "MINISTRY_LEADER", "ADMIN", "SUPER_ADMIN"] } },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!course) notFound();
  if (user.role === "INSTRUCTOR" && course.authorId !== user.id) {
    throw new ForbiddenError("You can only edit your own courses.");
  }

  const boundUpdate = updateCourseAction.bind(null, courseId);
  const boundCreateCohort = createCohortAction.bind(null, courseId);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href="/admin/courses" className="text-sm text-muted-foreground hover:text-foreground">
          ← Courses
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold">{course.title}</h1>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <p className="font-medium">Course details</p>
          <div className="mt-4">
            <CourseForm
              action={boundUpdate}
              mode="edit"
              course={course}
              programs={programs}
              people={people.map((p) => ({ id: p.id, name: p.name ?? p.email }))}
              canReassignAuthor={user.role !== "INSTRUCTOR"}
              storageConfigured={r2Configured}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <p className="font-medium">Modules & lessons</p>
        {course.modules.map((mod, mi) => (
          <Card key={mod.id} className="border-border/60">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  Module {mi + 1} · {mod.title}
                </p>
                <ModuleStageSelect moduleId={mod.id} courseId={course.id} stage={mod.stage} />
              </div>
              <div className="mt-3 divide-y divide-border rounded-md border border-border/60">
                {mod.lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/admin/courses/${course.id}/lessons/${lesson.id}`}
                    className="block p-3 text-sm transition-colors hover:bg-secondary/50"
                  >
                    {lesson.title}
                  </Link>
                ))}
                {mod.lessons.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground">No lessons yet.</p>
                )}
              </div>
              <form
                action={createLessonAction.bind(null, mod.id, course.id)}
                className="mt-3 flex gap-2"
              >
                <Input name="title" placeholder="Lesson title" required className="flex-1" />
                <Input name="slug" placeholder="lesson-slug" required className="w-40" />
                <Button type="submit" size="sm" variant="outline">
                  Add lesson
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}

        <Card className="border-dashed border-border">
          <CardContent className="p-5">
            <p className="font-medium">Add module</p>
            <form
              action={createModuleAction.bind(null, course.id)}
              className="mt-3 flex flex-wrap gap-2"
            >
              <Input name="title" placeholder="Module title" required className="flex-1" />
              <Input name="description" placeholder="Description (optional)" className="flex-1" />
              <Button type="submit" size="sm">
                Add
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div>
          <p className="font-medium">Cohorts</p>
          <p className="text-sm text-muted-foreground">
            A course can run multiple cohorts — each with its own students, mentors, timeline,
            and Tribes. Manage Tribes for a cohort from{" "}
            <Link href="/admin/cohorts" className="underline underline-offset-4">
              Cohorts &amp; Tribes
            </Link>
            .
          </p>
        </div>
        {course.cohorts.map((cohort) => (
          <Card key={cohort.id} className="border-border/60">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{cohort.name}</p>
                <p className="text-sm text-muted-foreground">
                  Starts {cohort.startDate.toLocaleDateString()}
                  {cohort.endDate ? ` · Ends ${cohort.endDate.toLocaleDateString()}` : ""} ·{" "}
                  {cohort._count.tribes} tribe{cohort._count.tribes === 1 ? "" : "s"}
                </p>
              </div>
              <CohortStatusSelect cohortId={cohort.id} courseId={course.id} status={cohort.status} />
            </CardContent>
          </Card>
        ))}
        {course.cohorts.length === 0 && (
          <p className="text-sm text-muted-foreground">No cohorts yet.</p>
        )}

        <Card className="border-dashed border-border">
          <CardContent className="p-5">
            <p className="font-medium">New cohort</p>
            <form action={boundCreateCohort} className="mt-3 grid gap-2 sm:grid-cols-2">
              <Input name="name" placeholder="e.g. Cohort One — August 2026" required />
              <Input name="slug" placeholder="cohort-one" required />
              <Input name="startDate" type="date" required />
              <Input name="endDate" type="date" />
              <Button type="submit" size="sm" className="sm:col-span-2 sm:w-fit">
                Create cohort
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {course.mentors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{course.mentors.length} course mentor(s)</Badge>
        </div>
      )}
    </div>
  );
}
