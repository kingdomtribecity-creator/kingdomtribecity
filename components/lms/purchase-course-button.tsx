"use client";

import { useActionState, useState } from "react";
import { createCoursePurchaseCheckoutAction } from "@/lib/actions/course-purchase";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function PurchaseCourseButton({
  courseId,
  priceCents,
  stripeEnabled = true,
  paystackEnabled = false,
}: {
  courseId: string;
  priceCents: number;
  stripeEnabled?: boolean;
  paystackEnabled?: boolean;
}) {
  const boundAction = createCoursePurchaseCheckoutAction.bind(null, courseId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const [provider, setProvider] = useState<"stripe" | "paystack">(
    stripeEnabled ? "stripe" : "paystack"
  );
  const showProviderChoice = stripeEnabled && paystackEnabled;

  return (
    <div>
      {showProviderChoice && (
        <Tabs value={provider} onValueChange={(v) => setProvider(v as typeof provider)} className="mb-3">
          <TabsList>
            <TabsTrigger value="stripe">Card (Stripe)</TabsTrigger>
            <TabsTrigger value="paystack">Paystack</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      <form action={formAction}>
        <input type="hidden" name="provider" value={provider} />
        <Button type="submit" disabled={pending}>
          {pending ? "Redirecting to checkout…" : `Purchase — $${(priceCents / 100).toFixed(0)}`}
        </Button>
      </form>
      {state?.error && <p className="mt-2 text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
