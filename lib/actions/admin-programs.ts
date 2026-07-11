"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

function optionalStr(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
}

export async function createProgramAction(formData: FormData) {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);

  const slug = String(formData.get("slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!slug || !name || !tagline || !description) return;

  const program = await prisma.program.create({
    data: {
      slug,
      name,
      tagline,
      description,
      visionBody: optionalStr(formData, "visionBody"),
      heroImage: optionalStr(formData, "heroImage"),
      published: formData.get("published") === "on",
    },
  });

  revalidatePath("/admin/programs");
  revalidatePath("/expressions");
  redirect(`/admin/programs/${program.id}`);
}

export async function updateProgramAction(programId: string, formData: FormData) {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);

  await prisma.program.update({
    where: { id: programId },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      tagline: String(formData.get("tagline") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      visionBody: optionalStr(formData, "visionBody"),
      heroImage: optionalStr(formData, "heroImage"),
      published: formData.get("published") === "on",
      featuredCourseId: optionalStr(formData, "featuredCourseId"),
    },
  });

  revalidatePath("/admin/programs");
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath("/expressions");
}

export async function deleteProgramAction(programId: string) {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  await prisma.program.delete({ where: { id: programId } });
  revalidatePath("/admin/programs");
  revalidatePath("/expressions");
  redirect("/admin/programs");
}

// ── FAQ ──────────────────────────────────────────────────────────────────

export async function createProgramFaqAction(programId: string, formData: FormData) {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);

  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!question || !answer) return;

  const count = await prisma.programFaq.count({ where: { programId } });
  await prisma.programFaq.create({
    data: { programId, question, answer, order: count },
  });

  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath("/expressions");
}

export async function deleteProgramFaqAction(faqId: string, programId: string) {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  await prisma.programFaq.delete({ where: { id: faqId } });
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath("/expressions");
}

// ── "Also feature in this Expression" ───────────────────────────────────

export async function updateFeaturedCoursesAction(programId: string, formData: FormData) {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  const courseIds = formData.getAll("courseIds").map(String);

  await prisma.$transaction([
    prisma.programCourseFeature.deleteMany({ where: { programId } }),
    prisma.programCourseFeature.createMany({
      data: courseIds.map((courseId, order) => ({ programId, courseId, order })),
    }),
  ]);

  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath("/expressions");
}

export async function updateFeaturedResourcesAction(programId: string, formData: FormData) {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  const resourceIds = formData.getAll("resourceIds").map(String);

  await prisma.$transaction([
    prisma.programResourceFeature.deleteMany({ where: { programId } }),
    prisma.programResourceFeature.createMany({
      data: resourceIds.map((resourceId, order) => ({ programId, resourceId, order })),
    }),
  ]);

  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath("/expressions");
}
