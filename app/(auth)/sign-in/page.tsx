import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/sign-in-form";

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
      <SignInForm callbackUrl={callbackUrl} />
      <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Demo access</p>
        <p className="mt-1">student@kingdomtribecity.org · admin@kingdomtribecity.org</p>
        <p>Password: KingdomDemo!23</p>
      </div>
    </div>
  );
}
