"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export function SignUpForm({ googleConfigured }: { googleConfigured: boolean }) {
  const [state, formAction, pending] = useActionState(signUpAction, undefined);

  return (
    <div className="space-y-6">
      <GoogleSignInButton callbackUrl="/dashboard" configured={googleConfigured} />
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" required autoComplete="name" placeholder="Ade Johnson" />
        </div>
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
            autoComplete="new-password"
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating your account…" : "Start Your Journey"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already planted here?{" "}
          <Link href="/sign-in" className="text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
