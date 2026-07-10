"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav({
  links,
  authed,
}: {
  links: { href: string; label: string }[];
  authed: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle className="font-heading">Kingdom Tribe City</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2.5 text-sm text-foreground hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/give"
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-2.5 text-sm text-foreground hover:bg-secondary"
          >
            Give
          </Link>
          <div className="mt-4 flex flex-col gap-2">
            {authed ? (
              <Button asChild onClick={() => setOpen(false)}>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild onClick={() => setOpen(false)}>
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild onClick={() => setOpen(false)}>
                  <Link href="/sign-up">Start Your Journey</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
