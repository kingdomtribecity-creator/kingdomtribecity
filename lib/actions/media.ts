"use server";

import { randomUUID } from "node:crypto";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getUploadUrl, publicUrlForKey, r2Configured } from "@/lib/r2";
import type { MediaKind } from "@/lib/generated/prisma/enums";

function slugifyFilename(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const base = dot > 0 ? filename.slice(0, dot) : filename;
  const ext = dot > 0 ? filename.slice(dot) : "";
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${slug || "file"}${ext.toLowerCase()}`;
}

export type RequestUploadState =
  | { error: string }
  | { uploadUrl: string; publicUrl: string; key: string };

export async function requestUploadAction(
  category: string,
  filename: string,
  mimeType: string
): Promise<RequestUploadState> {
  await requirePermission(PERMISSIONS.MEDIA_UPLOAD);

  if (!r2Configured) {
    return { error: "Storage isn't connected yet — add your Cloudflare R2 credentials to enable uploads." };
  }

  const key = `${category}/${randomUUID()}-${slugifyFilename(filename)}`;
  const uploadUrl = await getUploadUrl(key, mimeType);
  const publicUrl = publicUrlForKey(key);

  return { uploadUrl, publicUrl, key };
}

function kindFromMime(mimeType: string): MediaKind {
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (mimeType.startsWith("image/")) return "IMAGE";
  return "DOCUMENT";
}

export async function createMediaAssetAction(input: {
  key: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const user = await requirePermission(PERMISSIONS.MEDIA_UPLOAD);

  return prisma.mediaAsset.create({
    data: {
      key: input.key,
      url: input.url,
      filename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      kind: kindFromMime(input.mimeType),
      uploadedById: user.id,
    },
  });
}
