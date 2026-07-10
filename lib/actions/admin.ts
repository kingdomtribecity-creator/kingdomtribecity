"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import type { Role, Stage } from "@/lib/generated/prisma/enums";

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
  await requireAdmin();
  const programId = String(formData.get("programId"));
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const stage = String(formData.get("stage")) as Stage;
  const description = String(formData.get("description") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;

  if (!title || !slug || !stage || !description || !programId) return;

  const course = await prisma.course.create({
    data: { programId, title, slug, stage, description, subtitle },
  });

  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${course.id}`);
}

export async function updateCourseAction(courseId: string, formData: FormData) {
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
  await prisma.lesson.delete({ where: { id: lessonId } });
  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}`);
}

// ── Cohorts / Tribes ──────────────────────────────────────────────────

export async function createCohortAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!name || !slug) return;

  await prisma.cohort.create({
    data: { name, slug, startDate: new Date() },
  });
  revalidatePath("/admin/cohorts");
}

export async function createTribeAction(cohortId: string, formData: FormData) {
  await requireAdmin();
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
  await requireAdmin();
  await prisma.tribe.update({
    where: { id: tribeId },
    data: { mentorId: mentorId || null },
  });
  revalidatePath("/admin/cohorts");
}

// ── Announcements ────────────────────────────────────────────────────

export async function createAnnouncementAction(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;

  await prisma.announcement.create({ data: { title, body } });
  revalidatePath("/admin/announcements");
}

export async function togglePinAnnouncementAction(id: string, pinned: boolean) {
  await requireAdmin();
  await prisma.announcement.update({ where: { id }, data: { pinned } });
  revalidatePath("/admin/announcements");
}

export async function deleteAnnouncementAction(id: string) {
  await requireAdmin();
  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/admin/announcements");
}
