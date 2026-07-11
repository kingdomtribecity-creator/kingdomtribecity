"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { stripe, stripeConfigured } from "@/lib/stripe";

export type CoursePurchaseState = { error: string } | undefined;

export async function createCoursePurchaseCheckoutAction(
  courseId: string,
  _prevState: CoursePurchaseState
): Promise<CoursePurchaseState> {
  const user = await requireUser();

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.pricingType !== "PAID" || !course.priceCents) {
    return { error: "This course isn't available for purchase." };
  }

  if (!stripeConfigured || !stripe) {
    return {
      error: "Payments aren't fully connected yet in this environment — add STRIPE_SECRET_KEY to enable checkout.",
    };
  }

  const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: course.priceCents,
          product_data: { name: course.title },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/learn/${course.slug}?purchased=1`,
    cancel_url: `${origin}/learn/${course.slug}`,
    customer_email: user.email ?? undefined,
    metadata: { kind: "course_purchase", courseId: course.id, userId: user.id },
  });

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    update: { paymentStatus: "PENDING", stripeCheckoutSessionId: session.id },
    create: {
      userId: user.id,
      courseId: course.id,
      paymentStatus: "PENDING",
      stripeCheckoutSessionId: session.id,
    },
  });

  redirect(session.url!);
}
