import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_AREA_ROLES, type PermissionKey } from "@/lib/permissions";
import type { Role } from "@/lib/generated/prisma/enums";

export class UnauthorizedError extends Error {
  constructor(message = "You must be signed in.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Server-side session guard. Never trust a role passed from the client. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  return session.user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new ForbiddenError();
  return user;
}

export async function requireAdmin() {
  return requireRole("ADMIN", "SUPER_ADMIN");
}

/** Platform credentials (email/payments/AI/SMS provider keys) — deliberately not delegable via the permission system. */
export async function requireSuperAdmin() {
  return requireRole("SUPER_ADMIN");
}

export async function requireMentorOrAdmin() {
  return requireRole("MENTOR", "ADMIN", "SUPER_ADMIN");
}

/** Anyone allowed into /admin at all; individual pages scope further (e.g. instructors see only their own content). */
export async function requireAdminArea() {
  return requireRole(...ADMIN_AREA_ROLES);
}

/** SUPER_ADMIN always passes — every other role is looked up against the (editable) RolePermission table. */
export async function hasPermission(role: Role, key: PermissionKey): Promise<boolean> {
  if (role === "SUPER_ADMIN") return true;
  const count = await prisma.rolePermission.count({
    where: { role, permission: { key } },
  });
  return count > 0;
}

export async function requirePermission(key: PermissionKey) {
  const user = await requireUser();
  const allowed = await hasPermission(user.role, key);
  if (!allowed) throw new ForbiddenError();
  return user;
}
