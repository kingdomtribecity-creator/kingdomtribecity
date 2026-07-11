"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requirePermission, ForbiddenError } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type {
  Role,
  Stage,
  CourseStatus,
  CourseDifficulty,
  CourseFormat,
  CourseAccessLevel,
  PricingType,
  CohortStatus,
} from "@/lib/generated/prisma/enums";

/** Instructors may only touch courses they authored; every other content-manage role can touch any course. */
async function assertCourseAccess(courseId: string) {
  const user = await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  if (user.role !== "INSTRUCTOR") return user;

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { authorId: true } });
  if (course?.authorId !== user.id) throw new ForbiddenError("You can only edit your own courses.");
  return user;
}

function optionalStr(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
}

function optionalInt(formData: FormData, key: string): number | null {
  const v = String(formData.get(key) ?? "").trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function optionalDate(formData: FormData, key: string): Date | null {
  const v = String(formData.get(key) ?? "").trim();
  return v ? new Date(v) : null;
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

function courseFieldsFromForm(formData: FormData) {
  const mentorIds = formData.getAll("mentorIds").map(String);
  return {
    title: String(formData.get("title") ?? "").trim(),
    subtitle: optionalStr(formData, "subtitle"),
    description: String(formData.get("description") ?? "").trim(),
    stage: (optionalStr(formData, "stage") as Stage | null) ?? null,
    category: optionalStr(formData, "category"),
    difficulty: (optionalStr(formData, "difficulty") as CourseDifficulty | null) ?? null,
    durationLabel: optionalStr(formData, "durationLabel"),
    startDate: optionalDate(formData, "startDate"),
    endDate: optionalDate(formData, "endDate"),
    format: (String(formData.get("format") ?? "SELF_PACED") as CourseFormat),
    accessLevel: (String(formData.get("accessLevel") ?? "PUBLIC") as CourseAccessLevel),
    pricingType: (String(formData.get("pricingType") ?? "FREE") as PricingType),
    priceCents: (() => {
      const dollars = optionalInt(formData, "priceDollars");
      return dollars !== null ? dollars * 100 : null;
    })(),
    certificateEnabled: formData.get("certificateEnabled") === "on",
    status: (String(formData.get("status") ?? "DRAFT") as CourseStatus),
    coverImage: optionalStr(formData, "coverImage"),
    authorId: optionalStr(formData, "authorId"),
    mentorIds,
  };
}

export async function createCourseAction(formData: FormData) {
  const user = await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  const programId = String(formData.get("programId"));
  const slug = String(formData.get("slug") ?? "").trim();
  const fields = courseFieldsFromForm(formData);

  if (!fields.title || !slug || !fields.description || !programId) return;

  const course = await prisma.course.create({
    data: {
      programId,
      slug,
      title: fields.title,
      subtitle: fields.subtitle,
      description: fields.description,
      stage: fields.stage,
      category: fields.category,
      difficulty: fields.difficulty,
      durationLabel: fields.durationLabel,
      startDate: fields.startDate,
      endDate: fields.endDate,
      format: fields.format,
      accessLevel: fields.accessLevel,
      pricingType: fields.pricingType,
      priceCents: fields.priceCents,
      certificateEnabled: fields.certificateEnabled,
      status: fields.status,
      coverImage: fields.coverImage,
      authorId: user.role === "INSTRUCTOR" ? user.id : fields.authorId,
      mentors: fields.mentorIds.length
        ? { create: fields.mentorIds.map((userId) => ({ userId })) }
        : undefined,
    },
  });

  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${course.id}`);
}

export async function updateCourseAction(courseId: string, formData: FormData) {
  const user = await assertCourseAccess(courseId);
  const fields = courseFieldsFromForm(formData);

  await prisma.course.update({
    where: { id: courseId },
    data: {
      title: fields.title,
      subtitle: fields.subtitle,
      description: fields.description,
      stage: fields.stage,
      category: fields.category,
      difficulty: fields.difficulty,
      durationLabel: fields.durationLabel,
      startDate: fields.startDate,
      endDate: fields.endDate,
      format: fields.format,
      accessLevel: fields.accessLevel,
      pricingType: fields.pricingType,
      priceCents: fields.priceCents,
      certificateEnabled: fields.certificateEnabled,
      status: fields.status,
      coverImage: fields.coverImage,
      // Instructors can't reassign authorship or the mentor roster of their own course.
      ...(user.role === "INSTRUCTOR"
        ? {}
        : {
            authorId: fields.authorId,
            mentors: { deleteMany: {}, create: fields.mentorIds.map((userId) => ({ userId })) },
          }),
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/admin/courses");
}

export async function createModuleAction(courseId: string, formData: FormData) {
  await assertCourseAccess(courseId);
  const title = String(formData.get("title") ?? "").trim();
  const description = optionalStr(formData, "description");
  const stage = (optionalStr(formData, "stage") as Stage | null) ?? null;
  if (!title) return;

  const count = await prisma.module.count({ where: { courseId } });
  await prisma.module.create({
    data: { courseId, title, description, stage, order: count },
  });

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function updateModuleStageAction(moduleId: string, courseId: string, stage: Stage | "") {
  await assertCourseAccess(courseId);
  await prisma.module.update({
    where: { id: moduleId },
    data: { stage: stage || null },
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
      summary: optionalStr(formData, "summary"),
      teachingBody: optionalStr(formData, "teachingBody"),
      teachingVideoUrl: optionalStr(formData, "teachingVideoUrl"),
      scriptureRefs,
      scriptureText: optionalStr(formData, "scriptureText"),
      prayerPrompt: optionalStr(formData, "prayerPrompt"),
      assignmentPrompt: optionalStr(formData, "assignmentPrompt"),
      journalPrompt: optionalStr(formData, "journalPrompt"),
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

export async function createCohortAction(courseId: string, formData: FormData) {
  await assertCourseAccess(courseId);
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const startDate = optionalDate(formData, "startDate") ?? new Date();
  const endDate = optionalDate(formData, "endDate");
  if (!name || !slug) return;

  await prisma.cohort.create({
    data: { courseId, name, slug, startDate, endDate },
  });
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/admin/cohorts");
}

export async function updateCohortStatusAction(cohortId: string, courseId: string, status: CohortStatus) {
  await assertCourseAccess(courseId);
  await prisma.cohort.update({ where: { id: cohortId }, data: { status } });
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/admin/cohorts");
}

export async function createTribeAction(cohortId: string, formData: FormData) {
  await requirePermission(PERMISSIONS.COHORTS_MANAGE);
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const mentorId = optionalStr(formData, "mentorId");
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
  const cohortId = optionalStr(formData, "cohortId");
  if (!title || !body) return;

  await prisma.announcement.create({ data: { title, body, cohortId } });
  revalidatePath("/admin/announcements");
  if (cohortId) revalidatePath(`/tribe`);
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
