"use server";

import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { onboardingSchema } from "@/lib/validations";
import { FLAGSHIP_PROGRAM_SLUG } from "@/lib/constants";

export type OnboardingActionState = { error?: string; success?: boolean } | undefined;

export async function completeOnboardingAction(
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const user = await requireUser();

  const parsed = onboardingSchema.safeParse({
    sphereOfInfluence: formData.get("sphereOfInfluence"),
    bio: formData.get("bio") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please complete the form." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      sphereOfInfluence: parsed.data.sphereOfInfluence,
      bio: parsed.data.bio,
      onboardedAt: new Date(),
    },
  });

  // New members are onboarded into the flagship program's first published
  // course and its active cohort — the one deliberate default in an
  // otherwise fully dynamic, admin-created program catalog.
  const activeCohort = await prisma.cohort.findFirst({
    where: { status: "ACTIVE", course: { program: { slug: FLAGSHIP_PROGRAM_SLUG } } },
    orderBy: { startDate: "desc" },
    include: { course: true, tribes: { include: { _count: { select: { members: true } } } } },
  });

  const firstCourse =
    activeCohort?.course ??
    (await prisma.course.findFirst({
      where: { status: "PUBLISHED", program: { slug: FLAGSHIP_PROGRAM_SLUG } },
      orderBy: { order: "asc" },
    }));

  if (firstCourse) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: firstCourse.id } },
      update: {},
      create: {
        userId: user.id,
        courseId: firstCourse.id,
        cohortId: activeCohort?.id,
      },
    });
  }

  const alreadyInTribe = await prisma.tribeMembership.findFirst({
    where: { userId: user.id },
  });
  if (!alreadyInTribe && activeCohort && activeCohort.tribes.length > 0) {
    const smallestTribe = [...activeCohort.tribes].sort(
      (a, b) => a._count.members - b._count.members
    )[0];
    await prisma.tribeMembership.create({
      data: { userId: user.id, tribeId: smallestTribe.id },
    });
  }

  return { success: true };
}
