import { notFound } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { DiscussionThread } from "@/components/community/discussion-thread";
import { PrayerRequestList } from "@/components/community/prayer-request-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

function initials(name: string | null) {
  if (!name) return "KTC";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default async function TribePage({
  params,
}: {
  params: Promise<{ tribeSlug: string }>;
}) {
  const { tribeSlug } = await params;
  const user = await requireUser();

  const tribe = await prisma.tribe.findUnique({
    where: { slug: tribeSlug },
    include: {
      mentor: true,
      cohort: true,
      members: { include: { user: true } },
      discussionPosts: {
        orderBy: { createdAt: "desc" },
        include: { user: true, comments: { orderBy: { createdAt: "asc" }, include: { user: true } } },
      },
      prayerRequests: { orderBy: { createdAt: "desc" }, include: { user: true } },
    },
  });
  if (!tribe) notFound();

  const isMember = tribe.members.some((m) => m.userId === user.id);
  const isMentor = tribe.mentorId === user.id;
  const canAccess = isMember || isMentor || user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  if (!canAccess) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="text-muted-foreground">
          You&apos;re not a member of {tribe.name}.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm text-muted-foreground">{tribe.cohort.name}</p>
      <h1 className="mt-1 font-heading text-3xl font-semibold">{tribe.name}</h1>
      {tribe.mentor && (
        <p className="mt-2 text-sm text-muted-foreground">
          Mentored by <span className="font-medium text-foreground">{tribe.mentor.name}</span>
        </p>
      )}

      <Tabs defaultValue="discussion" className="mt-8">
        <TabsList>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
          <TabsTrigger value="prayer">Prayer</TabsTrigger>
          <TabsTrigger value="members">Members ({tribe.members.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="discussion" className="mt-6">
          <DiscussionThread tribeSlug={tribeSlug} posts={tribe.discussionPosts} />
        </TabsContent>

        <TabsContent value="prayer" className="mt-6">
          <PrayerRequestList
            tribeSlug={tribeSlug}
            prayers={tribe.prayerRequests}
            canModerate={isMentor || user.role === "ADMIN" || user.role === "SUPER_ADMIN"}
            currentUserId={user.id}
          />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <div className="space-y-3">
            {tribe.mentor && (
              <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <Avatar className="size-9">
                  <AvatarFallback>{initials(tribe.mentor.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{tribe.mentor.name}</p>
                  <Badge variant="secondary" className="mt-0.5">Mentor</Badge>
                </div>
              </div>
            )}
            {tribe.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                <Avatar className="size-9">
                  <AvatarFallback>{initials(m.user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{m.user.name}</p>
                  <p className="text-xs text-muted-foreground">{m.user.sphereOfInfluence}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
