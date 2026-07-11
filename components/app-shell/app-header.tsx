import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavLink } from "@/components/app-shell/nav-link";
import { UserMenu } from "@/components/app-shell/user-menu";
import type { Role, Stage } from "@/lib/generated/prisma/enums";

export function AppHeader({
  user,
  tribeHref,
}: {
  user: {
    name: string | null | undefined;
    email: string | null | undefined;
    role: Role;
    stage: Stage;
  };
  tribeHref: string | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-heading text-lg font-semibold tracking-tight">
            Kingdom Tribe City
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <NavLink href="/dashboard">Home</NavLink>
            <NavLink href="/learn">Journey</NavLink>
            {tribeHref && <NavLink href={tribeHref}>My Tribe</NavLink>}
            <NavLink href="/resources">Resources</NavLink>
            <NavLink href="/events">Events</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <UserMenu {...user} />
        </div>
      </div>
    </header>
  );
}
