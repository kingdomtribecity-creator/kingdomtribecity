"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

function indexesFor(formData: FormData, pattern: RegExp): number[] {
  const found = new Set<number>();
  for (const key of formData.keys()) {
    const m = key.match(pattern);
    if (m) found.add(Number(m[1]));
  }
  return [...found].sort((a, b) => a - b);
}

export async function saveQuizAction(lessonId: string, courseId: string, formData: FormData) {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);

  const title = String(formData.get("quizTitle") ?? "").trim();
  const passScorePercent = Number(formData.get("passScorePercent") ?? 70) || 70;
  if (!title) return;

  const questions = indexesFor(formData, /^question_(\d+)_prompt$/)
    .map((qi) => {
      const prompt = String(formData.get(`question_${qi}_prompt`) ?? "").trim();
      const correctIndex = Number(formData.get(`question_${qi}_correct`) ?? -1);
      const options = indexesFor(formData, new RegExp(`^question_${qi}_option_(\\d+)_label$`))
        .map((oi) => ({
          label: String(formData.get(`question_${qi}_option_${oi}_label`) ?? "").trim(),
          isCorrect: oi === correctIndex,
        }))
        .filter((o) => o.label);
      return { prompt, options };
    })
    .filter((q) => q.prompt && q.options.length >= 2 && q.options.some((o) => o.isCorrect));

  const existing = await prisma.quiz.findUnique({ where: { lessonId } });

  await prisma.$transaction(async (tx) => {
    const quiz = existing
      ? await tx.quiz.update({ where: { id: existing.id }, data: { title, passScorePercent } })
      : await tx.quiz.create({ data: { lessonId, title, passScorePercent } });

    await tx.quizQuestion.deleteMany({ where: { quizId: quiz.id } });

    for (const [qi, q] of questions.entries()) {
      await tx.quizQuestion.create({
        data: {
          quizId: quiz.id,
          prompt: q.prompt,
          order: qi,
          options: { create: q.options },
        },
      });
    }
  });

  revalidatePath(`/admin/courses/${courseId}/lessons/${lessonId}`);
}

export async function deleteQuizAction(quizId: string, lessonId: string, courseId: string) {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  await prisma.quiz.delete({ where: { id: quizId } });
  revalidatePath(`/admin/courses/${courseId}/lessons/${lessonId}`);
}

export async function attachResourcesToLessonAction(
  lessonId: string,
  courseId: string,
  formData: FormData
) {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  const resourceIds = formData.getAll("resourceIds").map(String);

  await prisma.$transaction([
    prisma.lessonResource.deleteMany({ where: { lessonId } }),
    prisma.lessonResource.createMany({
      data: resourceIds.map((resourceId, order) => ({ lessonId, resourceId, order })),
    }),
  ]);

  revalidatePath(`/admin/courses/${courseId}/lessons/${lessonId}`);
}
