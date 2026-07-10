import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Testimonies" };

export default async function TestimoniesPage() {
  const testimonies = await prisma.testimony.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Testimonies
      </p>
      <h1 className="mt-4 font-heading text-4xl font-semibold">Stories of transformation</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Real stories from real members of Kingdom Tribe City — planted,
        rooted, formed, and sent.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {testimonies.map((t) => (
          <Card key={t.id} className="border-border/60">
            <CardContent className="p-8">
              <p className="font-heading text-xl">&ldquo;{t.title}&rdquo;</p>
              <p className="mt-3 text-muted-foreground">{t.body}</p>
              <p className="mt-5 text-sm font-medium">— {t.user.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {testimonies.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">No testimonies published yet.</p>
      )}
    </div>
  );
}
