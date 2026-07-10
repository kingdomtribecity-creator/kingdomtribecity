import { auth } from "@/lib/auth";
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
  return requireRole("ADMIN");
}

export async function requireMentorOrAdmin() {
  return requireRole("MENTOR", "ADMIN");
}
