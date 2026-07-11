"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePermission, requireAdminArea } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type {
  ResourceType,
  ResourceCategory,
  ResourceVisibility,
} from "@/lib/generated/prisma/enums";

function parseTags(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function optionalString(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? "").trim();
  return value || null;
}

export async function createResourceAction(formData: FormData) {
  const user = await requirePermission(PERMISSIONS.CONTENT_MANAGE);

  const resource = await prisma.resource.create({
    data: {
      title: String(formData.get("title") ?? "").trim(),
      slug: String(formData.get("slug") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      type: formData.get("type") as ResourceType,
      category: formData.get("category") as ResourceCategory,
      visibility: formData.get("visibility") as ResourceVisibility,
      tags: parseTags(formData.get("tags")),
      published: formData.get("published") === "on",
      externalUrl: optionalString(formData.get("externalUrl")),
      coverImage: optionalString(formData.get("coverImage")),
      speakerId: optionalString(formData.get("speakerId")),
      programId: optionalString(formData.get("programId")),
      mediaAssetId: optionalString(formData.get("mediaAssetId")),
      createdById: user.id,
      relatedTo: {
        connect: formData.getAll("relatedResourceIds").map((id) => ({ id: String(id) })),
      },
    },
  });

  revalidatePath("/admin/resources");
  redirect(`/admin/resources/${resource.id}`);
}

export async function updateResourceAction(resourceId: string, formData: FormData) {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);

  const relatedIds = formData.getAll("relatedResourceIds").map((id) => ({ id: String(id) }));

  await prisma.resource.update({
    where: { id: resourceId },
    data: {
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      type: formData.get("type") as ResourceType,
      category: formData.get("category") as ResourceCategory,
      visibility: formData.get("visibility") as ResourceVisibility,
      tags: parseTags(formData.get("tags")),
      published: formData.get("published") === "on",
      externalUrl: optionalString(formData.get("externalUrl")),
      coverImage: optionalString(formData.get("coverImage")),
      speakerId: optionalString(formData.get("speakerId")),
      programId: optionalString(formData.get("programId")),
      mediaAssetId: optionalString(formData.get("mediaAssetId")),
      relatedTo: { set: relatedIds },
    },
  });

  revalidatePath("/admin/resources");
  revalidatePath(`/admin/resources/${resourceId}`);
}

export async function deleteResourceAction(resourceId: string) {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  await prisma.resource.delete({ where: { id: resourceId } });
  revalidatePath("/admin/resources");
  redirect("/admin/resources");
}

/** Instructors only see/manage their own courses; everyone else in the admin area sees all. */
export async function scopedCourseWhere() {
  const user = await requireAdminArea();
  if (user.role === "INSTRUCTOR") return { authorId: user.id };
  return {};
}
