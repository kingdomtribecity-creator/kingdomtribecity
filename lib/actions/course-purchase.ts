"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { initializePaystackTransaction } from "@/lib/paystack";
import { getIntegrationSecrets } from "@/lib/integrations";

export type CoursePurchaseState = { error: string } | undefined;

export async function createCoursePurchaseCheckoutAction(
  courseId: string,
  _prevState: CoursePurchaseState,
  formData: FormData
): Promise<CoursePurchaseState> {
  const user = await requireUser();

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.pricingType !== "PAID" || !course.priceCents) {
    return { error: "This course isn't available for purchase." };
  }

  const provider = formData.get("provider") === "paystack" ? "paystack" : "stripe";
  const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (provider === "paystack") {
    const found = await getIntegrationSecrets("PAYMENTS", "paystack");
    if (!found?.secrets.secretKey) {
      return { error: "Paystack isn't connected yet." };
    }
    if (!user.email) {
      return { error: "Your account needs an email address to purchase via Paystack." };
    }

    const { authorizationUrl, reference } = await initializePaystackTransaction({
      secretKey: found.secrets.secretKey,
      email: user.email,
      amountCents: course.priceCents,
      currency: found.config.currency || "NGN",
      callbackUrl: `${origin}/learn/${course.slug}?purchased=1`,
      metadata: { kind: "course_purchase", courseId: course.id, userId: user.id },
    });

    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      update: { paymentStatus: "PENDING", paymentProvider: "PAYSTACK", paystackReference: reference },
      create: {
        userId: user.id,
        courseId: course.id,
        paymentStatus: "PENDING",
        paymentProvider: "PAYSTACK",
        paystackReference: reference,
      },
    });

    redirect(authorizationUrl);
  }

  if (!stripeConfigured || !stripe) {
    return {
      error: "Payments aren't fully connected yet in this environment — add STRIPE_SECRET_KEY to enable checkout.",
    };
  }

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
    update: { paymentStatus: "PENDING", paymentProvider: "STRIPE", stripeCheckoutSessionId: session.id },
    create: {
      userId: user.id,
      courseId: course.id,
      paymentStatus: "PENDING",
      paymentProvider: "STRIPE",
      stripeCheckoutSessionId: session.id,
    },
  });

  redirect(session.url!);
}
