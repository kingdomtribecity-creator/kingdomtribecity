import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateCourseAction,
  createModuleAction,
  createLessonAction,
} from "@/lib/actions/admin";
import { STAGE_ORDER, STAGE_META } from "@/lib/stage";

export default async function AdminCourseEditPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } },
    },
  });
  if (!course) notFound();

  const boundUpdate = updateCourseAction.bind(null, courseId);

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
          <form action={boundUpdate} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={course.title} required />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" name="subtitle" defaultValue={course.subtitle ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stage">Stage</Label>
              <Select name="stage" defaultValue={course.stage}>
                <SelectTrigger id="stage" className="w-full">
                  <SelectValue />
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
            <div className="flex items-center gap-2 pt-6">
              <Checkbox id="published" name="published" defaultChecked={course.published} />
              <Label htmlFor="published">Published</Label>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={course.description}
                required
              />
            </div>
            <Button type="submit" className="sm:w-fit">
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <p className="font-medium">Modules & lessons</p>
        {course.modules.map((mod) => {
          const boundCreateLesson = createLessonAction.bind(null, mod.id, course.id);
          return (
            <Card key={mod.id} className="border-border/60">
              <CardContent className="p-5">
                <p className="font-medium">{mod.title}</p>
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
                <form action={boundCreateLesson} className="mt-3 flex gap-2">
                  <Input name="title" placeholder="Lesson title" required className="flex-1" />
                  <Input name="slug" placeholder="lesson-slug" required className="w-40" />
                  <Button type="submit" size="sm" variant="outline">
                    Add lesson
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}

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
    </div>
  );
}
