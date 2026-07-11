import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { r2Configured } from "@/lib/r2";
import { createProgramAction } from "@/lib/actions/admin-programs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgramForm } from "@/components/admin/program-form";

export const metadata: Metadata = { title: "Programs" };

export default async function AdminProgramsPage() {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);

  const programs = await prisma.program.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { courses: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Programs</h1>
        <p className="text-sm text-muted-foreground">
          {programs.length} total — every program here automatically gets a public landing
          page at /expressions/[slug].
        </p>
      </div>

      <div className="grid gap-3">
        {programs.map((program) => (
          <Link key={program.id} href={`/admin/programs/${program.id}`}>
            <Card className="border-border/60 transition-colors hover:border-primary/40">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{program.name}</p>
                  <p className="text-sm text-muted-foreground">
                    /{program.slug} · {program._count.courses} course
                    {program._count.courses === 1 ? "" : "s"}
                  </p>
                </div>
                {!program.published && <Badge variant="outline">Draft</Badge>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-dashed border-border">
        <CardContent className="p-6">
          <p className="font-medium">New program</p>
          <div className="mt-4">
            <ProgramForm action={createProgramAction} mode="create" storageConfigured={r2Configured} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
