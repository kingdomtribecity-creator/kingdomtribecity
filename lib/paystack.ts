import { createHmac, timingSafeEqual } from "node:crypto";

export async function initializePaystackTransaction(params: {
  secretKey: string;
  email: string;
  amountCents: number;
  currency: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}): Promise<{ authorizationUrl: string; reference: string }> {
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountCents,
      currency: params.currency,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.status) {
    throw new Error(data?.message || `Paystack initialize failed (${res.status}).`);
  }

  return {
    authorizationUrl: data.data.authorization_url as string,
    reference: data.data.reference as string,
  };
}

export function verifyPaystackSignature(rawBody: string, signature: string | null, secretKey: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
