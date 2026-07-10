import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCourseAction } from "@/lib/actions/admin";
import { STAGE_ORDER, STAGE_META } from "@/lib/stage";

export const metadata: Metadata = { title: "Courses" };

export default async function AdminCoursesPage() {
  const [courses, programs] = await Promise.all([
    prisma.course.findMany({
      orderBy: { order: "asc" },
      include: { program: true, modules: { include: { lessons: true } } },
    }),
    prisma.program.findMany({ orderBy: { name: "asc" } }),
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
                    <Badge variant="secondary">{STAGE_META[course.stage].label}</Badge>
                    {!course.published && <Badge variant="outline">Draft</Badge>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="border-dashed border-border">
        <CardContent className="p-6">
          <p className="font-medium">New course</p>
          <form action={createCourseAction} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" required placeholder="e.g. fruitful-purpose" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="programId">Program</Label>
              <Select name="programId" required>
                <SelectTrigger id="programId" className="w-full">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stage">Stage</Label>
              <Select name="stage" required>
                <SelectTrigger id="stage" className="w-full">
                  <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STAGE_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" name="subtitle" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} required />
            </div>
            <Button type="submit" className="sm:col-span-2 sm:w-fit">
              Create course
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
