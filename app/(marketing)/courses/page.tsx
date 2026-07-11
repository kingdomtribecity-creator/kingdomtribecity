import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CourseCard } from "@/components/marketing/course-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Courses" };

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const courses = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      ...(category ? { category } : {}),
    },
    orderBy: { order: "asc" },
    include: { program: true },
  });

  const allCourses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    select: { category: true },
  });
  const categories = [...new Set(allCourses.map((c) => c.category).filter(Boolean))] as string[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Courses
      </p>
      <h1 className="mt-4 font-heading text-4xl font-semibold">Every course, one city</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Courses from every Kingdom Tribe City expression, discoverable in one
        place — self-paced, cohort-based, or a short intensive.
      </p>

      {categories.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/courses"
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              !category
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/courses?category=${encodeURIComponent(c)}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                category === c
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} programName={course.program.name} />
        ))}
      </div>

      {courses.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">No courses in this category yet.</p>
      )}
    </div>
  );
}
