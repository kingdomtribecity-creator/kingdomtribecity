import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { r2Configured } from "@/lib/r2";
import { updateProgramAction, deleteProgramAction } from "@/lib/actions/admin-programs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgramForm } from "@/components/admin/program-form";

export default async function AdminProgramEditPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);

  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) notFound();

  const boundUpdate = updateProgramAction.bind(null, programId);
  const boundDelete = deleteProgramAction.bind(null, programId);

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
          />
          <form action={boundDelete} className="mt-4 border-t border-border pt-4">
            <Button type="submit" variant="destructive" size="sm">
              Delete program
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
