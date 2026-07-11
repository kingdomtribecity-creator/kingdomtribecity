import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { r2Configured } from "@/lib/r2";
import { createResourceAction } from "@/lib/actions/admin-resources";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResourceForm } from "@/components/admin/resource-form";

export const metadata: Metadata = { title: "Resources" };

export default async function AdminResourcesPage() {
  const user = await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  const resourceWhere = user.role === "INSTRUCTOR" ? { createdById: user.id } : {};

  const [resources, speakers, programs, allResources] = await Promise.all([
    prisma.resource.findMany({
      where: resourceWhere,
      orderBy: { createdAt: "desc" },
      include: { speaker: true, mediaAsset: true },
    }),
    prisma.speaker.findMany({ orderBy: { name: "asc" } }),
    prisma.program.findMany({ orderBy: { name: "asc" } }),
    prisma.resource.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Resources</h1>
        <p className="text-sm text-muted-foreground">{resources.length} total</p>
      </div>

      <div className="grid gap-3">
        {resources.map((r) => (
          <Link key={r.id} href={`/admin/resources/${r.id}`}>
            <Card className="border-border/60 transition-colors hover:border-primary/40">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.mediaAsset ? r.mediaAsset.filename : r.externalUrl ? "External link" : "No file"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{r.type}</Badge>
                  {!r.published && <Badge variant="outline">Draft</Badge>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {resources.length === 0 && (
          <p className="text-sm text-muted-foreground">No resources yet — create the first one below.</p>
        )}
      </div>

      <Card className="border-dashed border-border">
        <CardContent className="p-6">
          <p className="font-medium">New resource</p>
          <div className="mt-4">
            <ResourceForm
              action={createResourceAction}
              mode="create"
              speakers={speakers}
              programs={programs}
              allResources={allResources.map((r) => ({ id: r.id, name: r.title }))}
              storageConfigured={r2Configured}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
