"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requirePermission, ForbiddenError } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { Role, Stage } from "@/lib/generated/prisma/enums";

/** Instructors may only touch courses they authored; every other content-manage role can touch any course. */
async function assertCourseAccess(courseId: string) {
  const user = await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  if (user.role !== "INSTRUCTOR") return user;

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { authorId: true } });
  if (course?.authorId !== user.id) throw new ForbiddenError("You can only edit your own courses.");
  return user;
}

// ── Roles & Permissions ──────────────────────────────────────────────

export async function togglePermissionAction(role: Role, permissionId: string, enabled: boolean) {
  await requireAdmin();

  if (enabled) {
    await prisma.rolePermission.upsert({
      where: { role_permissionId: { role, permissionId } },
      update: {},
      create: { role, permissionId },
    });
  } else {
    await prisma.rolePermission.deleteMany({ where: { role, permissionId } });
  }

  revalidatePath("/admin/settings/roles");
}

// ── Users ──────────────────────────────────────────────────────────────

export async function updateUserRoleAction(userId: string, role: Role) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}

export async function updateUserStageAction(userId: string, stage: Stage) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { stage } });
  revalidatePath("/admin/users");
}

// ── Courses / Modules / Lessons ───────────────────────────────────────

export async function createCourseAction(formData: FormData) {
  const user = await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  const programId = String(formData.get("programId"));
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const stage = String(formData.get("stage")) as Stage;
  const description = String(formData.get("description") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;

  if (!title || !slug || !stage || !description || !programId) return;

  const course = await prisma.course.create({
    data: {
      programId,
      title,
      slug,
      stage,
      description,
      subtitle,
      authorId: user.role === "INSTRUCTOR" ? user.id : null,
    },
  });

  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${course.id}`);
}

export async function updateCourseAction(courseId: string, formData: FormData) {
  await assertCourseAccess(courseId);
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim();
  const stage = String(formData.get("stage")) as Stage;
  const published = formData.get("published") === "on";

  await prisma.course.update({
    where: { id: courseId },
    data: { title, subtitle, description, stage, published },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/admin/courses");
}

export async function createModuleAction(courseId: string, formData: FormData) {
  await assertCourseAccess(courseId);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!title) return;

  const count = await prisma.module.count({ where: { courseId } });
  await prisma.module.create({
    data: { courseId, title, description, order: count },
  });

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function createLessonAction(
  moduleId: string,
  courseId: string,
  formData: FormData
) {
  await assertCourseAccess(courseId);
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!title || !slug) return;

  const count = await prisma.lesson.count({ where: { moduleId } });
  const lesson = await prisma.lesson.create({
    data: {
      moduleId,
      title,
      slug,
      order: count,
      reflectionQuestions: [
        "What is God revealing?",
        "What mindset is changing?",
        "What truth am I embracing?",
      ],
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}/lessons/${lesson.id}`);
}

export async function updateLessonAction(
  lessonId: string,
  courseId: string,
  formData: FormData
) {
  await assertCourseAccess(courseId);
  const scriptureRefs = String(formData.get("scriptureRefs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title: String(formData.get("title") ?? "").trim(),
      summary: String(formData.get("summary") ?? "").trim() || null,
      teachingBody: String(formData.get("teachingBody") ?? "").trim() || null,
      teachingVideoUrl: String(formData.get("teachingVideoUrl") ?? "").trim() || null,
      scriptureRefs,
      scriptureText: String(formData.get("scriptureText") ?? "").trim() || null,
      assignmentPrompt: String(formData.get("assignmentPrompt") ?? "").trim() || null,
      journalPrompt: String(formData.get("journalPrompt") ?? "").trim() || null,
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/admin/courses/${courseId}/lessons/${lessonId}`);
}

export async function deleteLessonAction(lessonId: string, courseId: string) {
  await assertCourseAccess(courseId);
  await prisma.lesson.delete({ where: { id: lessonId } });
  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}`);
}

// ── Cohorts / Tribes ──────────────────────────────────────────────────

export async function createCohortAction(formData: FormData) {
  await requirePermission(PERMISSIONS.COHORTS_MANAGE);
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!name || !slug) return;

  await prisma.cohort.create({
    data: { name, slug, startDate: new Date() },
  });
  revalidatePath("/admin/cohorts");
}

export async function createTribeAction(cohortId: string, formData: FormData) {
  await requirePermission(PERMISSIONS.COHORTS_MANAGE);
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const mentorId = String(formData.get("mentorId") ?? "") || null;
  if (!name || !slug) return;

  await prisma.tribe.create({
    data: { cohortId, name, slug, mentorId },
  });
  revalidatePath("/admin/cohorts");
}

export async function updateTribeMentorAction(tribeId: string, mentorId: string) {
  await requirePermission(PERMISSIONS.COHORTS_MANAGE);
  await prisma.tribe.update({
    where: { id: tribeId },
    data: { mentorId: mentorId || null },
  });
  revalidatePath("/admin/cohorts");
}

// ── Announcements ────────────────────────────────────────────────────

export async function createAnnouncementAction(formData: FormData) {
  await requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;

  await prisma.announcement.create({ data: { title, body } });
  revalidatePath("/admin/announcements");
}

export async function togglePinAnnouncementAction(id: string, pinned: boolean) {
  await requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);
  await prisma.announcement.update({ where: { id }, data: { pinned } });
  revalidatePath("/admin/announcements");
}

export async function deleteAnnouncementAction(id: string) {
  await requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);
  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/admin/announcements");
}
