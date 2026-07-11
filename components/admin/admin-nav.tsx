"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UsersRound,
  Megaphone,
  Library,
  FolderOpen,
  ShieldCheck,
} from "lucide-react";
import type { Role } from "@/lib/generated/prisma/enums";

const LINKS: { href: string; label: string; icon: typeof LayoutDashboard; roles: Role[] }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "ADMIN", "MINISTRY_LEADER"] },
  { href: "/admin/users", label: "Users", icon: Users, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/admin/courses", label: "Courses", icon: BookOpen, roles: ["SUPER_ADMIN", "ADMIN", "MINISTRY_LEADER", "INSTRUCTOR"] },
  { href: "/admin/resources", label: "Resources", icon: Library, roles: ["SUPER_ADMIN", "ADMIN", "MINISTRY_LEADER", "INSTRUCTOR"] },
  { href: "/admin/media", label: "Media", icon: FolderOpen, roles: ["SUPER_ADMIN", "ADMIN", "MINISTRY_LEADER", "INSTRUCTOR"] },
  { href: "/admin/cohorts", label: "Cohorts & Tribes", icon: UsersRound, roles: ["SUPER_ADMIN", "ADMIN", "MINISTRY_LEADER"] },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone, roles: ["SUPER_ADMIN", "ADMIN", "MINISTRY_LEADER"] },
  { href: "/admin/settings/roles", label: "Roles & Permissions", icon: ShieldCheck, roles: ["SUPER_ADMIN", "ADMIN"] },
];

export function AdminNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const links = LINKS.filter((link) => link.roles.includes(role));

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
