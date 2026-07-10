import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = { title: "Thank you" };

export default function GiveThankYouPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <CheckCircle2 className="mx-auto size-12 text-growth" />
      <h1 className="mt-6 font-heading text-3xl font-semibold">Thank you</h1>
      <p className="mt-3 text-muted-foreground">
        Your generosity helps plant, root, form, and send Kingdom
        Ambassadors into every sphere of influence.
      </p>
      <Button className="mt-8" asChild>
        <Link href="/">Return home</Link>
      </Button>
    </div>
  );
}
