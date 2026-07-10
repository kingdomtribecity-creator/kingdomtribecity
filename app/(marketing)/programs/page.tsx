import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { stageGradient } from "@/lib/gradients";

export const metadata: Metadata = { title: "Programs" };

const PROGRAM_HREF: Record<string, string> = {
  PLANTED_AND_ROOTED: "/sign-up",
  YOUNG_AND_YIELDED: "/expressions/young-and-yielded",
  KINGDOM_WARRIOR_WOMAN: "/expressions/kingdom-warrior-woman",
  KINGDOM_LEADERS: "/expressions/kingdom-leaders",
};

export default async function ProgramsPage() {
  const programs = await prisma.program.findMany({
    include: { courses: { where: { published: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Programs
        </p>
        <h1 className="mt-4 font-heading text-4xl font-semibold">
          One city. Many expressions.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Every KTC program walks the same Planted → Rooted → Formed →
          Fruitful → Sent pathway, expressed for a specific community.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {programs.map((program) => (
          <Card key={program.id} className="overflow-hidden border-border/60 py-0">
            <div
              className="h-28"
              style={{ backgroundImage: stageGradient("PLANTED") }}
            />
            <CardContent className="p-6">
              <p className="font-heading text-xl font-medium">{program.name}</p>
              <p className="mt-2 text-sm text-muted-foreground">{program.tagline}</p>
              <p className="mt-3 text-sm text-muted-foreground/90">{program.description}</p>
              {program.courses.length > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  {program.courses.length} course{program.courses.length === 1 ? "" : "s"} available
                </p>
              )}
              <Button className="mt-5" variant="outline" asChild>
                <Link href={PROGRAM_HREF[program.slug] ?? "/sign-up"}>Explore</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
