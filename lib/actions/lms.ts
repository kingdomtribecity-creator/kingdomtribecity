"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { reflectionSchema, journalSchema } from "@/lib/validations";
import { nextStage } from "@/lib/stage";

export async function enrollInCourseAction(courseId: string) {
  const user = await requireUser();
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId } },
    update: {},
    create: { userId: user.id, courseId },
  });
  revalidatePath("/learn");
}

export async function recordTeachingViewedAction(lessonId: string) {
  const user = await requireUser();
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { teachingViewedAt: new Date(), status: "IN_PROGRESS" },
    create: {
      userId: user.id,
      lessonId,
      status: "IN_PROGRESS",
      teachingViewedAt: new Date(),
    },
  });
}

export type LmsActionState = { error?: string; success?: boolean } | undefined;

export async function submitReflectionAction(
  lessonId: string,
  _prevState: LmsActionState,
  formData: FormData
): Promise<LmsActionState> {
  const user = await requireUser();
  const answers = formData.getAll("answer").map(String);

  const parsed = reflectionSchema.safeParse({ lessonId, answers });
  if (!parsed.success) {
    return { error: "Please answer each reflection question." };
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return { error: "Lesson not found." };

  const answerMap: Record<string, string> = {};
  lesson.reflectionQuestions.forEach((q, i) => {
    answerMap[q] = parsed.data.answers[i] ?? "";
  });

  await prisma.reflectionEntry.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { answers: answerMap },
    create: { userId: user.id, lessonId, answers: answerMap },
  });

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { reflectionDoneAt: new Date(), status: "IN_PROGRESS" },
    create: {
      userId: user.id,
      lessonId,
      status: "IN_PROGRESS",
      reflectionDoneAt: new Date(),
    },
  });

  return { success: true };
}

export async function submitAssignmentAction(lessonId: string): Promise<LmsActionState> {
  const user = await requireUser();
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { assignmentDoneAt: new Date(), status: "IN_PROGRESS" },
    create: {
      userId: user.id,
      lessonId,
      status: "IN_PROGRESS",
      assignmentDoneAt: new Date(),
    },
  });
  return { success: true };
}

export type JournalActionState =
  | { error?: string; success?: boolean; stageAdvanced?: boolean }
  | undefined;

export async function submitJournalAction(
  lessonId: string | null,
  _prevState: JournalActionState,
  formData: FormData
): Promise<JournalActionState> {
  const user = await requireUser();

  const parsed = journalSchema.safeParse({
    lessonId: lessonId ?? undefined,
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Write something before saving." };
  }

  await prisma.journalEntry.create({
    data: { userId: user.id, lessonId: lessonId ?? undefined, content: parsed.data.content },
  });

  if (!lessonId) {
    revalidatePath("/dashboard");
    return { success: true };
  }

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { journalDoneAt: new Date(), completedAt: new Date(), status: "COMPLETED" },
    create: {
      userId: user.id,
      lessonId,
      status: "COMPLETED",
      journalDoneAt: new Date(),
      completedAt: new Date(),
    },
  });

  const stageAdvanced = await maybeAdvanceProgress(user.id, lessonId);

  revalidatePath("/dashboard");
  revalidatePath("/learn", "layout");
  return { success: true, stageAdvanced };
}

/** After a lesson completes: checks course completion (+ certificate) and stage advancement. */
async function maybeAdvanceProgress(userId: string, lessonId: string): Promise<boolean> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: { include: { modules: { include: { lessons: true } } } } } } },
  });
  if (!lesson) return false;

  const course = lesson.module.course;
  const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));

  const completedCount = await prisma.lessonProgress.count({
    where: { userId, lessonId: { in: allLessonIds }, status: "COMPLETED" },
  });

  if (completedCount < allLessonIds.length) return false;

  await prisma.enrollment.updateMany({
    where: { userId, courseId: course.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  await prisma.certificate.upsert({
    where: { userId_courseId: { userId, courseId: course.id } },
    update: {},
    create: { userId, courseId: course.id },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.stage !== course.stage) return false;

  const stageCourses = await prisma.course.findMany({
    where: { stage: course.stage, published: true },
  });
  const stageCourseIds = stageCourses.map((c) => c.id);

  const completedStageCourses = await prisma.enrollment.count({
    where: { userId, courseId: { in: stageCourseIds }, status: "COMPLETED" },
  });

  if (completedStageCourses < stageCourseIds.length) return false;

  const next = nextStage(course.stage);
  if (!next) return false;

  await prisma.user.update({ where: { id: userId }, data: { stage: next } });
  return true;
}
