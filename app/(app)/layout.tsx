import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-shell/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const membership = await prisma.tribeMembership.findFirst({
    where: { userId: session.user.id },
    include: { tribe: true },
  });

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader
        user={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
          stage: session.user.stage,
        }}
        tribeHref={membership ? `/tribe/${membership.tribe.slug}` : null}
      />
      <main className="flex-1 bg-secondary/20">{children}</main>
    </div>
  );
}
