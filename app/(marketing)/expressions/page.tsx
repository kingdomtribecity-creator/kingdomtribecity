import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ExpressionCard } from "@/components/marketing/expression-card";

export const metadata: Metadata = { title: "Expressions" };

export default async function ExpressionsPage() {
  const programs = await prisma.program.findMany({
    where: { published: true },
    include: { courses: { where: { status: "PUBLISHED" } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Expressions
        </p>
        <h1 className="mt-4 font-heading text-4xl font-semibold">
          One city. Many expressions.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Every KTC expression walks the same Planted → Rooted → Formed →
          Fruitful → Sent pathway, lived out for a specific community — new
          expressions are added from the admin dashboard, not a code
          release.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {programs.map((program) => (
          <ExpressionCard
            key={program.id}
            program={program}
            courseCount={program.courses.length}
          />
        ))}
      </div>
    </div>
  );
}
