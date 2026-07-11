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
      heroImage: optionalStr(formData, "heroImage"),
      published: formData.get("published") === "on",
    },
  });

  revalidatePath("/admin/programs");
  revalidatePath("/programs");
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
      heroImage: optionalStr(formData, "heroImage"),
      published: formData.get("published") === "on",
    },
  });

  revalidatePath("/admin/programs");
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath("/programs");
}

export async function deleteProgramAction(programId: string) {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  await prisma.program.delete({ where: { id: programId } });
  revalidatePath("/admin/programs");
  revalidatePath("/programs");
  redirect("/admin/programs");
}
