"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export function SignInForm({
  callbackUrl,
  googleConfigured,
}: {
  callbackUrl?: string;
  googleConfigured: boolean;
}) {
  const [state, formAction, pending] = useActionState(signInAction, undefined);

  return (
    <div className="space-y-6">
      <GoogleSignInButton callbackUrl={callbackUrl} configured={googleConfigured} />
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/dashboard"} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Your password"
          />
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/sign-up" className="text-foreground underline underline-offset-4">
            Start your journey
          </Link>
        </p>
      </form>
    </div>
  );
}
