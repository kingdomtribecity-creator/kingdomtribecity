import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateLessonAction, deleteLessonAction } from "@/lib/actions/admin";
import { requirePermission, ForbiddenError } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";

export default async function AdminLessonEditPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const user = await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  const [lesson, course] = await Promise.all([
    prisma.lesson.findUnique({ where: { id: lessonId } }),
    prisma.course.findUnique({ where: { id: courseId }, select: { authorId: true } }),
  ]);
  if (!lesson) notFound();
  if (user.role === "INSTRUCTOR" && course?.authorId !== user.id) {
    throw new ForbiddenError("You can only edit your own courses.");
  }

  const boundUpdate = updateLessonAction.bind(null, lessonId, courseId);
  const boundDelete = deleteLessonAction.bind(null, lessonId, courseId);

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href={`/admin/courses/${courseId}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Course
      </Link>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <form action={boundUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={lesson.title} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="summary">Summary</Label>
              <Input id="summary" name="summary" defaultValue={lesson.summary ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teachingVideoUrl">Teaching video URL (embed)</Label>
              <Input
                id="teachingVideoUrl"
                name="teachingVideoUrl"
                defaultValue={lesson.teachingVideoUrl ?? ""}
                placeholder="https://www.youtube.com/embed/..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teachingBody">Teaching content</Label>
              <Textarea
                id="teachingBody"
                name="teachingBody"
                rows={5}
                defaultValue={lesson.teachingBody ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scriptureRefs">Scripture references (comma separated)</Label>
              <Input
                id="scriptureRefs"
                name="scriptureRefs"
                defaultValue={lesson.scriptureRefs.join(", ")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scriptureText">Scripture text</Label>
              <Textarea
                id="scriptureText"
                name="scriptureText"
                rows={3}
                defaultValue={lesson.scriptureText ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assignmentPrompt">Assignment prompt</Label>
              <Textarea
                id="assignmentPrompt"
                name="assignmentPrompt"
                rows={2}
                defaultValue={lesson.assignmentPrompt ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="journalPrompt">Journal prompt</Label>
              <Textarea
                id="journalPrompt"
                name="journalPrompt"
                rows={2}
                defaultValue={lesson.journalPrompt ?? ""}
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit">Save lesson</Button>
            </div>
          </form>
          <form action={boundDelete} className="mt-4 border-t border-border pt-4">
            <Button type="submit" variant="destructive" size="sm">
              Delete lesson
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
