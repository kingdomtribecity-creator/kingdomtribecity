import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { r2Configured } from "@/lib/r2";
import { createCourseAction } from "@/lib/actions/admin";
import { CourseForm } from "@/components/admin/course-form";

export const metadata: Metadata = { title: "Courses" };

export default async function AdminCoursesPage() {
  const user = await requirePermission(PERMISSIONS.CONTENT_MANAGE);

  const [courses, programs, people] = await Promise.all([
    prisma.course.findMany({
      where: user.role === "INSTRUCTOR" ? { authorId: user.id } : {},
      orderBy: { order: "asc" },
      include: { program: true, modules: { include: { lessons: true } } },
    }),
    prisma.program.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: { in: ["INSTRUCTOR", "MENTOR", "MINISTRY_LEADER", "ADMIN", "SUPER_ADMIN"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Courses</h1>
        <p className="text-sm text-muted-foreground">{courses.length} total</p>
      </div>

      <div className="grid gap-3">
        {courses.map((course) => {
          const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);
          return (
            <Link key={course.id} href={`/admin/courses/${course.id}`}>
              <Card className="border-border/60 transition-colors hover:border-primary/40">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{course.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.program.name} · {course.modules.length} modules · {lessonCount} lessons
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{course.status}</Badge>
                    {course.pricingType === "PAID" && <Badge variant="outline">Paid</Badge>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {courses.length === 0 && (
          <p className="text-sm text-muted-foreground">No courses yet — create the first one below.</p>
        )}
      </div>

      <Card className="border-dashed border-border">
        <CardContent className="p-6">
          <p className="font-medium">New course</p>
          <div className="mt-4">
            <CourseForm
              action={createCourseAction}
              mode="create"
              programs={programs}
              people={people.map((p) => ({ id: p.id, name: p.name ?? p.email }))}
              canReassignAuthor={user.role !== "INSTRUCTOR"}
              storageConfigured={r2Configured}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
