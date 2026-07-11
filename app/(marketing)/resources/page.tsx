import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABEL, TYPE_LABEL, canViewResource } from "@/lib/resource-labels";
import { cn } from "@/lib/utils";
import type { ResourceCategory } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "Resource Library" };

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory = category as ResourceCategory | undefined;

  const [session, resources] = await Promise.all([
    auth(),
    prisma.resource.findMany({
      where: {
        published: true,
        ...(activeCategory ? { category: activeCategory } : {}),
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const role = session?.user?.role ?? null;
  const visibleResources = resources.filter((r) => canViewResource(r.visibility, role));

  const categories = Object.entries(CATEGORY_LABEL) as [ResourceCategory, string][];

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Resource Library
      </p>
      <h1 className="mt-4 font-heading text-4xl font-semibold">Kingdom resources</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Teachings, sermons, articles, studies, and devotionals to help you
        grow — wherever you are on the pathway.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/resources"
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm",
            !activeCategory
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          All
        </Link>
        {categories.map(([value, label]) => (
          <Link
            key={value}
            href={`/resources?category=${value}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              activeCategory === value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleResources.map((r) => (
          <Link key={r.id} href={`/resources/${r.slug}`}>
            <Card className="h-full overflow-hidden border-border/60 py-0 transition-colors hover:border-primary/40">
              {r.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.coverImage} alt="" className="h-36 w-full object-cover" />
              )}
              <CardContent className="flex h-full flex-col p-6">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{TYPE_LABEL[r.type]}</Badge>
                  <Badge variant="outline">{CATEGORY_LABEL[r.category]}</Badge>
                </div>
                <p className="mt-3 font-heading text-lg font-medium">{r.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {visibleResources.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">No resources in this category yet.</p>
      )}
    </div>
  );
}
