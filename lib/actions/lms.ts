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

export type QuizActionState =
  | { error?: string; success?: boolean; scorePercent?: number; passed?: boolean }
  | undefined;

/** Grades server-side only — correct answers are never sent to the client. */
export async function submitQuizAttemptAction(
  quizId: string,
  _prevState: QuizActionState,
  formData: FormData
): Promise<QuizActionState> {
  const user = await requireUser();

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { include: { options: true } } },
  });
  if (!quiz) return { error: "Quiz not found." };

  let correctCount = 0;
  const answers: Record<string, string> = {};
  for (const question of quiz.questions) {
    const selectedOptionId = String(formData.get(`question_${question.id}`) ?? "");
    answers[question.id] = selectedOptionId;
    if (question.options.find((o) => o.id === selectedOptionId)?.isCorrect) {
      correctCount += 1;
    }
  }

  const scorePercent =
    quiz.questions.length > 0 ? Math.round((correctCount / quiz.questions.length) * 100) : 0;
  const passed = scorePercent >= quiz.passScorePercent;

  await prisma.quizAttempt.create({
    data: { quizId, userId: user.id, scorePercent, passed, answers },
  });

  return { success: true, scorePercent, passed };
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

/**
 * After a lesson completes: checks module completion (drives stage
 * advancement — a Module, not a whole Course, is what forms a stage) and
 * course completion (drives Enrollment completion + certificate issuance).
 */
async function maybeAdvanceProgress(userId: string, lessonId: string): Promise<boolean> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          lessons: true,
          course: { include: { modules: { include: { lessons: true } } } },
        },
      },
    },
  });
  if (!lesson) return false;

  const mod = lesson.module;
  const course = mod.course;

  let stageAdvanced = false;
  const moduleLessonIds = mod.lessons.map((l) => l.id);
  const moduleCompletedCount = await prisma.lessonProgress.count({
    where: { userId, lessonId: { in: moduleLessonIds }, status: "COMPLETED" },
  });

  if (moduleLessonIds.length > 0 && moduleCompletedCount >= moduleLessonIds.length && mod.stage) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const next = user && user.stage === mod.stage ? nextStage(mod.stage) : null;
    if (next) {
      await prisma.user.update({ where: { id: userId }, data: { stage: next } });
      stageAdvanced = true;
    }
  }

  const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const courseCompletedCount = await prisma.lessonProgress.count({
    where: { userId, lessonId: { in: allLessonIds }, status: "COMPLETED" },
  });

  if (allLessonIds.length > 0 && courseCompletedCount >= allLessonIds.length) {
    await prisma.enrollment.updateMany({
      where: { userId, courseId: course.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    if (course.certificateEnabled) {
      await prisma.certificate.upsert({
        where: { userId_courseId: { userId, courseId: course.id } },
        update: {},
        create: { userId, courseId: course.id },
      });
    }
  }

  return stageAdvanced;
}
