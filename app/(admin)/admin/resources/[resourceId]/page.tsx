import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { r2Configured } from "@/lib/r2";
import { ForbiddenError } from "@/lib/rbac";
import { updateResourceAction, deleteResourceAction } from "@/lib/actions/admin-resources";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResourceForm } from "@/components/admin/resource-form";

export default async function AdminResourceEditPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const user = await requirePermission(PERMISSIONS.CONTENT_MANAGE);

  const [resource, speakers, programs, allResources] = await Promise.all([
    prisma.resource.findUnique({
      where: { id: resourceId },
      include: { mediaAsset: true, relatedTo: { select: { id: true } } },
    }),
    prisma.speaker.findMany({ orderBy: { name: "asc" } }),
    prisma.program.findMany({ orderBy: { name: "asc" } }),
    prisma.resource.findMany({
      where: { id: { not: resourceId } },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  if (!resource) notFound();
  if (user.role === "INSTRUCTOR" && resource.createdById !== user.id) {
    throw new ForbiddenError();
  }

  const boundUpdate = updateResourceAction.bind(null, resourceId);
  const boundDelete = deleteResourceAction.bind(null, resourceId);

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/admin/resources" className="text-sm text-muted-foreground hover:text-foreground">
        ← Resources
      </Link>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <ResourceForm
            action={boundUpdate}
            mode="edit"
            resource={resource}
            speakers={speakers}
            programs={programs}
            allResources={allResources.map((r) => ({ id: r.id, name: r.title }))}
            storageConfigured={r2Configured}
          />
          <form action={boundDelete} className="mt-4 border-t border-border pt-4">
            <Button type="submit" variant="destructive" size="sm">
              Delete resource
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
