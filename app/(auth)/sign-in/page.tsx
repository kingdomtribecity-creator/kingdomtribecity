import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/sign-in-form";
import { googleConfigured } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue your journey.
        </p>
      </div>
      <SignInForm callbackUrl={callbackUrl} googleConfigured={googleConfigured} />
    </div>
  );
}
