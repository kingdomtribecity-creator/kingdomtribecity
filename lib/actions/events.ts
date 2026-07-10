"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function registerForEventAction(eventId: string, eventSlug: string) {
  const user = await requireUser();

  await prisma.eventRegistration.upsert({
    where: { eventId_userId: { eventId, userId: user.id } },
    update: {},
    create: { eventId, userId: user.id },
  });

  revalidatePath(`/events/${eventSlug}`);
}
