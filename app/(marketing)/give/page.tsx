import type { Metadata } from "next";
import { GiveForm } from "@/components/marketing/give-form";
import { stripeConfigured } from "@/lib/stripe";
import { isIntegrationEnabled } from "@/lib/integrations";

export const metadata: Metadata = { title: "Give" };

export default async function GivePage() {
  const paystackEnabled = await isIntegrationEnabled("PAYMENTS", "paystack");

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Partnership
      </p>
      <h1 className="mt-4 font-heading text-4xl font-semibold">Give</h1>
      <p className="mt-4 text-muted-foreground">
        Your partnership plants, roots, forms, and sends believers into every
        sphere of society.
      </p>
      <div className="mt-10">
        <GiveForm stripeEnabled={stripeConfigured} paystackEnabled={paystackEnabled} />
      </div>
    </div>
  );
}
