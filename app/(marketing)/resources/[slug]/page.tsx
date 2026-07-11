import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABEL, TYPE_LABEL, canViewResource } from "@/lib/resource-labels";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [session, resource] = await Promise.all([
    auth(),
    prisma.resource.findUnique({
      where: { slug },
      include: {
        speaker: true,
        program: true,
        mediaAsset: true,
        relatedTo: { select: { slug: true, title: true } },
      },
    }),
  ]);
  if (!resource || !resource.published) notFound();

  const role = session?.user?.role ?? null;
  if (!canViewResource(resource.visibility, role)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <p className="text-muted-foreground">
          This resource is restricted.{" "}
          {!session?.user && (
            <Link href={`/sign-in?callbackUrl=/resources/${slug}`} className="underline underline-offset-4">
              Sign in
            </Link>
          )}
        </p>
      </div>
    );
  }

  await prisma.resource.update({
    where: { id: resource.id },
    data: { viewCount: { increment: 1 } },
  });

  const openUrl = resource.mediaAsset?.url ?? resource.externalUrl;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{TYPE_LABEL[resource.type]}</Badge>
        <Badge variant="outline">{CATEGORY_LABEL[resource.category]}</Badge>
      </div>
      <h1 className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">
        {resource.title}
      </h1>
      {resource.speaker && (
        <p className="mt-2 text-sm text-muted-foreground">
          {resource.speaker.name}
          {resource.speaker.title ? ` — ${resource.speaker.title}` : ""}
        </p>
      )}
      <p className="mt-4 text-lg text-muted-foreground">{resource.description}</p>

      {resource.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {resource.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {openUrl ? (
        <Button className="mt-8" asChild>
          <a href={openUrl} target="_blank" rel="noreferrer">
            Open resource
          </a>
        </Button>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          Media for this resource is coming soon.
        </p>
      )}

      {resource.relatedTo.length > 0 && (
        <div className="mt-12 border-t border-border pt-6">
          <p className="text-sm font-medium">Related resources</p>
          <ul className="mt-3 space-y-2">
            {resource.relatedTo.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/resources/${r.slug}`}
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
