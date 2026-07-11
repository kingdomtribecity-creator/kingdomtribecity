import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  createAnnouncementAction,
  togglePinAnnouncementAction,
  deleteAnnouncementAction,
} from "@/lib/actions/admin";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Announcements" };

export default async function AdminAnnouncementsPage() {
  await requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Announcements</h1>
        <p className="text-sm text-muted-foreground">{announcements.length} total</p>
      </div>

      <div className="space-y-3">
        {announcements.map((a) => (
          <Card key={a.id} className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{a.title}</p>
                    {a.pinned && <Badge variant="secondary">Pinned</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <form action={togglePinAnnouncementAction.bind(null, a.id, !a.pinned)}>
                    <Button type="submit" size="sm" variant="outline">
                      {a.pinned ? "Unpin" : "Pin"}
                    </Button>
                  </form>
                  <form action={deleteAnnouncementAction.bind(null, a.id)}>
                    <Button type="submit" size="sm" variant="ghost">
                      Delete
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed border-border">
        <CardContent className="p-6">
          <p className="font-medium">New announcement</p>
          <form action={createAnnouncementAction} className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Message</Label>
              <Textarea id="body" name="body" rows={3} required />
            </div>
            <Button type="submit">Post announcement</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
