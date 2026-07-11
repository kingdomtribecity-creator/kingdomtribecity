import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIntegrationSecrets } from "@/lib/integrations";
import { verifyPaystackSignature } from "@/lib/paystack";

export async function POST(req: Request) {
  const found = await getIntegrationSecrets("PAYMENTS", "paystack");
  if (!found?.secrets.secretKey) {
    return NextResponse.json({ error: "Paystack not configured" }, { status: 503 });
  }

  const signature = req.headers.get("x-paystack-signature");
  const body = await req.text();

  if (!verifyPaystackSignature(body, signature, found.secrets.secretKey)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body) as {
    event: string;
    data: { reference: string; metadata?: { kind?: string } };
  };

  if (event.event === "charge.success") {
    const reference = event.data.reference;

    if (event.data.metadata?.kind === "course_purchase") {
      await prisma.enrollment.updateMany({
        where: { paystackReference: reference },
        data: { paymentStatus: "PAID", status: "ACTIVE" },
      });
    } else {
      await prisma.transaction.updateMany({
        where: { paystackReference: reference },
        data: { status: "SUCCEEDED" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
