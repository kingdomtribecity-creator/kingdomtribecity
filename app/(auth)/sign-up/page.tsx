import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { googleConfigured } from "@/lib/auth";

export const metadata: Metadata = { title: "Start Your Journey" };

export default function SignUpPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold">Start your journey</h1>
        <p className="text-sm text-muted-foreground">
          Create your account to be planted, rooted, formed, and sent.
        </p>
      </div>
      <SignUpForm googleConfigured={googleConfigured} />
    </div>
  );
}
