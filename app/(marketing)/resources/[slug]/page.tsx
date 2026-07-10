import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABEL, TYPE_LABEL } from "@/lib/resource-labels";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = await prisma.resource.findUnique({ where: { slug } });
  if (!resource || !resource.published) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{TYPE_LABEL[resource.type]}</Badge>
        <Badge variant="outline">{CATEGORY_LABEL[resource.category]}</Badge>
      </div>
      <h1 className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">
        {resource.title}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">{resource.description}</p>

      {resource.mediaUrl ? (
        <Button className="mt-8" asChild>
          <a href={resource.mediaUrl} target="_blank" rel="noreferrer">
            Open resource
          </a>
        </Button>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          Media for this resource is coming soon.
        </p>
      )}
    </div>
  );
}
