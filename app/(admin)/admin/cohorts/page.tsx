import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  createCohortAction,
  createTribeAction,
} from "@/lib/actions/admin";
import { TribeMentorSelect } from "@/components/admin/tribe-mentor-select";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Cohorts & Tribes" };

export default async function AdminCohortsPage() {
  await requirePermission(PERMISSIONS.COHORTS_MANAGE);

  const [cohorts, mentors] = await Promise.all([
    prisma.cohort.findMany({
      orderBy: { startDate: "desc" },
      include: {
        tribes: { include: { mentor: true, _count: { select: { members: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["MENTOR", "ADMIN", "SUPER_ADMIN", "MINISTRY_LEADER"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Cohorts & Tribes</h1>
        <p className="text-sm text-muted-foreground">{cohorts.length} cohorts</p>
      </div>

      {cohorts.map((cohort) => (
        <Card key={cohort.id} className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <p className="font-medium">{cohort.name}</p>
              {cohort.active && <Badge variant="secondary">Active</Badge>}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {cohort.tribes.map((tribe) => (
                <div key={tribe.id} className="rounded-md border border-border/60 p-3">
                  <p className="text-sm font-medium">{tribe.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {tribe._count.members} member{tribe._count.members === 1 ? "" : "s"}
                  </p>
                  <div className="mt-2">
                    <TribeMentorSelect
                      tribeId={tribe.id}
                      mentorId={tribe.mentorId}
                      mentors={mentors.map((m) => ({ id: m.id, name: m.name }))}
                    />
                  </div>
                </div>
              ))}
            </div>

            <form
              action={createTribeAction.bind(null, cohort.id)}
              className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4"
            >
              <Input name="name" placeholder="Tribe name" required className="flex-1" />
              <Input name="slug" placeholder="tribe-slug" required className="w-40" />
              <Button type="submit" size="sm" variant="outline">
                Add tribe
              </Button>
            </form>
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed border-border">
        <CardContent className="p-6">
          <p className="font-medium">New cohort</p>
          <form action={createCohortAction} className="mt-4 flex flex-wrap items-end gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" required />
            </div>
            <Button type="submit">Create cohort</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
