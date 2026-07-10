"use client";

import { useActionState, useState } from "react";
import { createGivingCheckoutAction } from "@/lib/actions/giving";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const PRESETS = [25, 50, 100, 250];

export function GiveForm() {
  const [state, formAction, pending] = useActionState(
    createGivingCheckoutAction,
    undefined
  );
  const [amount, setAmount] = useState(50);
  const [type, setType] = useState<"ONE_TIME" | "RECURRING">("ONE_TIME");

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label>Frequency</Label>
        <Tabs value={type} onValueChange={(v) => setType(v as typeof type)}>
          <TabsList>
            <TabsTrigger value="ONE_TIME">One-time</TabsTrigger>
            <TabsTrigger value="RECURRING">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
        <input type="hidden" name="type" value={type} />
      </div>

      <div className="space-y-2">
        <Label>Amount</Label>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setAmount(p)}
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                amount === p
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              ${p}
            </button>
          ))}
        </div>
        <Input
          type="number"
          name="amount"
          min={1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="mt-2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="designation">Designation (optional)</Label>
        <Input id="designation" name="designation" placeholder="e.g. Planted & Rooted" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Redirecting to checkout…" : `Give $${amount}${type === "RECURRING" ? "/mo" : ""}`}
      </Button>
    </form>
  );
}
