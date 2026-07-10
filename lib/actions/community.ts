"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  discussionPostSchema,
  prayerRequestSchema,
} from "@/lib/validations";

async function assertTribeAccess(userId: string, tribeId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role === "ADMIN") return;

  const tribe = await prisma.tribe.findUnique({ where: { id: tribeId } });
  if (tribe?.mentorId === userId) return;

  const membership = await prisma.tribeMembership.findUnique({
    where: { userId_tribeId: { userId, tribeId } },
  });
  if (!membership) throw new Error("You're not a member of this Tribe.");
}

export type CommunityActionState = { error?: string } | undefined;

export async function postDiscussionAction(
  tribeSlug: string,
  _prevState: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const user = await requireUser();
  const tribe = await prisma.tribe.findUnique({ where: { slug: tribeSlug } });
  if (!tribe) return { error: "Tribe not found." };

  const parsed = discussionPostSchema.safeParse({
    tribeId: tribe.id,
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: "Write something before posting." };

  await assertTribeAccess(user.id, tribe.id);

  await prisma.discussionPost.create({
    data: { tribeId: tribe.id, userId: user.id, body: parsed.data.body },
  });

  revalidatePath(`/tribe/${tribeSlug}`);
}

export async function postCommentAction(
  postId: string,
  tribeSlug: string,
  _prevState: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const user = await requireUser();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a reply first." };

  await prisma.discussionComment.create({
    data: { postId, userId: user.id, body },
  });

  revalidatePath(`/tribe/${tribeSlug}`);
}

export async function postPrayerRequestAction(
  tribeSlug: string,
  _prevState: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const user = await requireUser();
  const tribe = await prisma.tribe.findUnique({ where: { slug: tribeSlug } });
  if (!tribe) return { error: "Tribe not found." };

  const parsed = prayerRequestSchema.safeParse({
    tribeId: tribe.id,
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: "Write your prayer request first." };

  await prisma.prayerRequest.create({
    data: { tribeId: tribe.id, userId: user.id, body: parsed.data.body },
  });

  revalidatePath(`/tribe/${tribeSlug}`);
}

export async function markPrayerAnsweredAction(prayerId: string, tribeSlug: string) {
  const user = await requireUser();
  const prayer = await prisma.prayerRequest.findUnique({ where: { id: prayerId } });
  if (!prayer) return;
  if (prayer.userId !== user.id && user.role !== "ADMIN" && user.role !== "MENTOR") return;

  await prisma.prayerRequest.update({
    where: { id: prayerId },
    data: { status: "ANSWERED" },
  });

  revalidatePath(`/tribe/${tribeSlug}`);
}
