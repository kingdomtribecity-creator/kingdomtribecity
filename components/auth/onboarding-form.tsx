"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { completeOnboardingAction } from "@/lib/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SPHERES = [
  "Family",
  "Healthcare",
  "Business",
  "Technology",
  "Government",
  "Education",
  "Media",
  "Ministry",
];

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(
    completeOnboardingAction,
    undefined
  );
  const { update } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      void update().then(() => router.push("/dashboard"));
    }
  }, [state, update, router]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="sphereOfInfluence">Your sphere of influence</Label>
        <Select name="sphereOfInfluence" required>
          <SelectTrigger id="sphereOfInfluence" className="w-full">
            <SelectValue placeholder="Where has God placed you?" />
          </SelectTrigger>
          <SelectContent>
            {SPHERES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">What brought you here? (optional)</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={4}
          placeholder="Tell us a little about your story..."
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Getting you planted…" : "Begin my journey"}
      </Button>
    </form>
  );
}
