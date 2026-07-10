import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { startsAt: "asc" },
    include: { program: true, speakers: true },
  });

  const now = new Date();
  const upcoming = events.filter((e) => e.startsAt >= now);
  const past = events.filter((e) => e.startsAt < now);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Events
      </p>
      <h1 className="mt-4 font-heading text-4xl font-semibold">Gather with us</h1>

      <div className="mt-12 space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Upcoming</h2>
        {upcoming.length === 0 && (
          <p className="text-sm text-muted-foreground">No upcoming events right now — check back soon.</p>
        )}
        {upcoming.map((event) => (
          <Link key={event.id} href={`/events/${event.slug}`}>
            <Card className="border-border/60 transition-colors hover:border-primary/40">
              <CardContent className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-heading text-lg font-medium">{event.title}</p>
                    {event.program && <Badge variant="secondary">{event.program.name}</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                </div>
                <p className="shrink-0 text-sm text-muted-foreground">
                  {event.startsAt.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {past.length > 0 && (
        <div className="mt-14 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Past</h2>
          {past.map((event) => (
            <Link key={event.id} href={`/events/${event.slug}`}>
              <Card className="border-border/60 opacity-80 transition-colors hover:opacity-100">
                <CardContent className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-heading text-lg font-medium">{event.title}</p>
                  <p className="shrink-0 text-sm text-muted-foreground">
                    {event.startsAt.toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
