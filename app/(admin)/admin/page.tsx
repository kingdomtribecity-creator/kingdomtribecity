import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminArea } from "@/lib/rbac";
import { StatTile } from "@/components/admin/stat-tile";
import { StageBarChart } from "@/components/admin/stage-bar-chart";
import { Card, CardContent } from "@/components/ui/card";
import { STAGE_ORDER } from "@/lib/stage";
import type { Stage } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "Admin Overview" };

export default async function AdminOverviewPage() {
  const user = await requireAdminArea();
  if (user.role === "INSTRUCTOR") redirect("/admin/courses");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalMembers,
    activeLessonUsers,
    activeJournalUsers,
    totalEnrollments,
    completedEnrollments,
    totalAssignmentsDone,
    totalLessonProgress,
    eventRegistrations,
    discussionPosts,
    prayerRequests,
    stageCounts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: { in: ["STUDENT", "MENTOR"] } } }),
    prisma.lessonProgress.findMany({
      where: {
        OR: [
          { teachingViewedAt: { gte: thirtyDaysAgo } },
          { reflectionDoneAt: { gte: thirtyDaysAgo } },
          { assignmentDoneAt: { gte: thirtyDaysAgo } },
          { journalDoneAt: { gte: thirtyDaysAgo } },
        ],
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.journalEntry.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.enrollment.count(),
    prisma.enrollment.count({ where: { status: "COMPLETED" } }),
    prisma.lessonProgress.count({ where: { assignmentDoneAt: { not: null } } }),
    prisma.lessonProgress.count(),
    prisma.eventRegistration.count(),
    prisma.discussionPost.count(),
    prisma.prayerRequest.count(),
    prisma.user.groupBy({ by: ["stage"], _count: { _all: true } }),
  ]);

  const activeMemberIds = new Set([
    ...activeLessonUsers.map((u) => u.userId),
    ...activeJournalUsers.map((u) => u.userId),
  ]);

  const completionRate = totalEnrollments > 0
    ? Math.round((completedEnrollments / totalEnrollments) * 100)
    : 0;
  const assignmentRate = totalLessonProgress > 0
    ? Math.round((totalAssignmentsDone / totalLessonProgress) * 100)
    : 0;

  const stageCountMap = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0])) as Record<Stage, number>;
  for (const row of stageCounts) {
    stageCountMap[row.stage] = row._count._all;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">Kingdom Tribe City, at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total members" value={totalMembers} />
        <StatTile label="Active members (30d)" value={activeMemberIds.size} />
        <StatTile label="Course completion rate" value={`${completionRate}%`} />
        <StatTile label="Assignment submission rate" value={`${assignmentRate}%`} />
        <StatTile label="Event registrations" value={eventRegistrations} />
        <StatTile label="Discussion posts" value={discussionPosts} />
        <StatTile label="Prayer requests" value={prayerRequests} />
        <StatTile label="Total enrollments" value={totalEnrollments} />
      </div>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-muted-foreground">Stage distribution</p>
          <div className="mt-5">
            <StageBarChart counts={stageCountMap} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
