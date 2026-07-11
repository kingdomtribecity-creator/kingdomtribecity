import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { ROLE_ORDER, ROLE_LABEL } from "@/lib/permissions";
import { PermissionToggle } from "@/components/admin/permission-toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Roles & Permissions" };

export default async function AdminRolesPage() {
  await requireAdmin();

  const [permissions, rolePermissions] = await Promise.all([
    prisma.permission.findMany({ orderBy: [{ category: "asc" }, { label: "asc" }] }),
    prisma.rolePermission.findMany(),
  ]);

  const enabled = new Set(rolePermissions.map((rp) => `${rp.role}:${rp.permissionId}`));
  const categories = [...new Set(permissions.map((p) => p.category))];
  const editableRoles = ROLE_ORDER.filter((r) => r !== "SUPER_ADMIN" && r !== "GUEST");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Roles & Permissions</h1>
        <p className="text-sm text-muted-foreground">
          Super Administrator always has full access. Toggle what every other role can do —
          changes apply immediately, no deploy required.
        </p>
      </div>

      {categories.map((category) => (
        <div key={category} className="overflow-x-auto rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-64">{category}</TableHead>
                {editableRoles.map((role) => (
                  <TableHead key={role} className="text-center">
                    {ROLE_LABEL[role]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions
                .filter((p) => p.category === category)
                .map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">{permission.label}</TableCell>
                    {editableRoles.map((role) => (
                      <TableCell key={role} className="text-center">
                        <PermissionToggle
                          role={role}
                          permissionId={permission.id}
                          enabled={enabled.has(`${role}:${permission.id}`)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
