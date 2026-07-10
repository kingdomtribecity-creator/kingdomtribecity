import type { Metadata } from "next";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export const metadata: Metadata = { title: "Begin your journey" };

export default function OnboardingPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold">You&apos;re planted.</h1>
        <p className="text-sm text-muted-foreground">
          A couple of quick things, then we&apos;ll get you into your first
          course and your Tribe.
        </p>
      </div>
      <OnboardingForm />
    </div>
  );
}
