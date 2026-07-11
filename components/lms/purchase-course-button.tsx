"use client";

import { useActionState } from "react";
import { createCoursePurchaseCheckoutAction } from "@/lib/actions/course-purchase";
import { Button } from "@/components/ui/button";

export function PurchaseCourseButton({
  courseId,
  priceCents,
}: {
  courseId: string;
  priceCents: number;
}) {
  const boundAction = createCoursePurchaseCheckoutAction.bind(null, courseId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <div>
      <form action={formAction}>
        <Button type="submit" disabled={pending}>
          {pending ? "Redirecting to checkout…" : `Purchase — $${(priceCents / 100).toFixed(0)}`}
        </Button>
      </form>
      {state?.error && <p className="mt-2 text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
