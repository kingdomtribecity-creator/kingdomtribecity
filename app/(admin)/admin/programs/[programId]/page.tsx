import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { r2Configured } from "@/lib/r2";
import {
  updateProgramAction,
  deleteProgramAction,
  createProgramFaqAction,
  deleteProgramFaqAction,
  updateFeaturedCoursesAction,
  updateFeaturedResourcesAction,
} from "@/lib/actions/admin-programs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ProgramForm } from "@/components/admin/program-form";

export default async function AdminProgramEditPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);

  const [program, ownCourses, otherCourses, otherResources, featuredCourseIds, featuredResourceIds] =
    await Promise.all([
      prisma.program.findUnique({
        where: { id: programId },
        include: { faqs: { orderBy: { order: "asc" } } },
      }),
      prisma.course.findMany({
        where: { programId },
        select: { id: true, title: true },
        orderBy: { order: "asc" },
      }),
      prisma.course.findMany({
        where: { programId: { not: programId } },
        select: { id: true, title: true },
        orderBy: { title: "asc" },
      }),
      prisma.resource.findMany({
        where: { OR: [{ programId: { not: programId } }, { programId: null }] },
        select: { id: true, title: true },
        orderBy: { title: "asc" },
      }),
      prisma.programCourseFeature.findMany({ where: { programId }, select: { courseId: true } }),
      prisma.programResourceFeature.findMany({ where: { programId }, select: { resourceId: true } }),
    ]);
  if (!program) notFound();

  const boundUpdate = updateProgramAction.bind(null, programId);
  const boundDelete = deleteProgramAction.bind(null, programId);
  const boundCreateFaq = createProgramFaqAction.bind(null, programId);
  const boundUpdateFeaturedCourses = updateFeaturedCoursesAction.bind(null, programId);
  const boundUpdateFeaturedResources = updateFeaturedResourcesAction.bind(null, programId);
  const featuredCourseIdSet = new Set(featuredCourseIds.map((f) => f.courseId));
  const featuredResourceIdSet = new Set(featuredResourceIds.map((f) => f.resourceId));

  return (
    <div className="max-w-xl space-y-6">
      <Link href="/admin/programs" className="text-sm text-muted-foreground hover:text-foreground">
        ← Programs
      </Link>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <ProgramForm
            action={boundUpdate}
            mode="edit"
            program={program}
            storageConfigured={r2Configured}
            ownCourses={ownCourses}
          />
          <form action={boundDelete} className="mt-4 border-t border-border pt-4">
            <Button type="submit" variant="destructive" size="sm">
              Delete program
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <p className="font-medium">Frequently asked questions</p>
          <p className="text-sm text-muted-foreground">Shown on this Expression&apos;s Hub page.</p>

          <div className="mt-4 space-y-2">
            {program.faqs.map((faq) => (
              <div key={faq.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{faq.question}</p>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
                <form action={deleteProgramFaqAction.bind(null, faq.id, programId)}>
                  <Button type="submit" variant="ghost" size="sm">
                    Remove
                  </Button>
                </form>
              </div>
            ))}
          </div>

          <form action={boundCreateFaq} className="mt-4 space-y-3 border-t border-border pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="question">Question</Label>
              <Input id="question" name="question" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="answer">Answer</Label>
              <Textarea id="answer" name="answer" rows={2} required />
            </div>
            <Button type="submit" size="sm" variant="outline">
              Add question
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <p className="font-medium">Also feature in this Expression</p>
          <p className="text-sm text-muted-foreground">
            Courses owned by another Expression that should also appear on this Hub — the course
            isn&apos;t duplicated, just linked.
          </p>
          <form action={boundUpdateFeaturedCourses} className="mt-4 space-y-4">
            <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-md border border-border p-3">
              {otherCourses.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <Checkbox name="courseIds" value={c.id} defaultChecked={featuredCourseIdSet.has(c.id)} />
                  {c.title}
                </label>
              ))}
              {otherCourses.length === 0 && (
                <p className="text-sm text-muted-foreground">No other courses exist yet.</p>
              )}
            </div>
            <Button type="submit" size="sm" variant="outline">
              Save featured courses
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <p className="font-medium">Also feature these resources</p>
          <form action={boundUpdateFeaturedResources} className="mt-4 space-y-4">
            <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-md border border-border p-3">
              {otherResources.map((r) => (
                <label key={r.id} className="flex items-center gap-2 text-sm">
                  <Checkbox name="resourceIds" value={r.id} defaultChecked={featuredResourceIdSet.has(r.id)} />
                  {r.title}
                </label>
              ))}
              {otherResources.length === 0 && (
                <p className="text-sm text-muted-foreground">No resources in the library yet.</p>
              )}
            </div>
            <Button type="submit" size="sm" variant="outline">
              Save featured resources
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
