import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { registerForEventAction } from "@/lib/actions/events";
import { CheckCircle2 } from "lucide-react";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [event, session] = await Promise.all([
    prisma.event.findUnique({
      where: { slug },
      include: { program: true, speakers: true, registrations: true },
    }),
    auth(),
  ]);

  if (!event) notFound();

  const isPast = event.startsAt < new Date();
  const isRegistered = session?.user
    ? event.registrations.some((r) => r.userId === session.user.id)
    : false;
  const registerAction = registerForEventAction.bind(null, event.id, event.slug);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      {event.program && (
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {event.program.name}
        </p>
      )}
      <h1 className="mt-4 font-heading text-4xl font-semibold">{event.title}</h1>
      <p className="mt-3 text-muted-foreground">
        {event.startsAt.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
        {event.location ? ` · ${event.location}` : ""}
      </p>

      <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
        {event.description}
      </p>

      {event.speakers.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-medium">Speakers</p>
          <ul className="mt-2 space-y-1">
            {event.speakers.map((s) => (
              <li key={s.id} className="text-sm text-muted-foreground">
                {s.name}
                {s.title ? ` — ${s.title}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10">
        {isPast ? (
          event.recordingUrl ? (
            <Button asChild>
              <a href={event.recordingUrl} target="_blank" rel="noreferrer">
                Watch recording
              </a>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">This event has passed.</p>
          )
        ) : isRegistered ? (
          <p className="flex items-center gap-2 text-sm font-medium text-growth">
            <CheckCircle2 className="size-4" /> You&apos;re registered
          </p>
        ) : session?.user ? (
          <form action={registerAction}>
            <Button type="submit">Register for this event</Button>
          </form>
        ) : (
          <Button asChild>
            <Link href={`/sign-in?callbackUrl=/events/${event.slug}`}>Sign in to register</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
