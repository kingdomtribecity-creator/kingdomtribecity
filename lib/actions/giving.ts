"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { initializePaystackTransaction } from "@/lib/paystack";
import { getIntegrationSecrets } from "@/lib/integrations";
import { givingSchema } from "@/lib/validations";

export type GivingActionState = { error?: string } | undefined;

export async function createGivingCheckoutAction(
  _prevState: GivingActionState,
  formData: FormData
): Promise<GivingActionState> {
  const parsed = givingSchema.safeParse({
    amountCents: Math.round(Number(formData.get("amount")) * 100),
    type: formData.get("type"),
    designation: formData.get("designation") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid gift amount." };
  }

  const provider = formData.get("provider") === "paystack" ? "paystack" : "stripe";
  const session = await auth();
  const { amountCents, type, designation } = parsed.data;
  const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (provider === "paystack") {
    if (type === "RECURRING") {
      return { error: "Recurring gifts aren't available with Paystack yet — choose a one-time gift, or pay with card." };
    }
    const found = await getIntegrationSecrets("PAYMENTS", "paystack");
    if (!found?.secrets.secretKey) {
      return { error: "Paystack isn't connected yet." };
    }
    if (!session?.user?.email) {
      return { error: "Sign in with an email address to give via Paystack." };
    }

    const { authorizationUrl, reference } = await initializePaystackTransaction({
      secretKey: found.secrets.secretKey,
      email: session.user.email,
      amountCents,
      currency: found.config.currency || "NGN",
      callbackUrl: `${origin}/give/thank-you`,
      metadata: { kind: "giving" },
    });

    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amountCents,
        type,
        designation,
        status: "PENDING",
        provider: "PAYSTACK",
        paystackReference: reference,
      },
    });

    redirect(authorizationUrl);
  }

  if (!stripeConfigured || !stripe) {
    return {
      error:
        "Giving isn't fully connected yet in this environment — add STRIPE_SECRET_KEY to enable live checkout.",
    };
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: type === "RECURRING" ? "subscription" : "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: { name: designation ? `Gift — ${designation}` : "Gift to Kingdom Tribe City" },
          ...(type === "RECURRING" ? { recurring: { interval: "month" as const } } : {}),
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/give/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/give`,
    customer_email: session?.user?.email ?? undefined,
  });

  await prisma.transaction.create({
    data: {
      userId: session?.user?.id,
      amountCents,
      type,
      designation,
      status: "PENDING",
      provider: "STRIPE",
      stripeCheckoutSessionId: checkoutSession.id,
    },
  });

  redirect(checkoutSession.url!);
}
