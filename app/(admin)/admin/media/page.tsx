import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { r2Configured } from "@/lib/r2";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Film, Music, Image as ImageIcon } from "lucide-react";

export const metadata: Metadata = { title: "Media Library" };

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const KIND_ICON = { VIDEO: Film, AUDIO: Music, IMAGE: ImageIcon, DOCUMENT: FileText } as const;

export default async function AdminMediaPage() {
  const user = await requirePermission(PERMISSIONS.MEDIA_UPLOAD);

  const assets = await prisma.mediaAsset.findMany({
    where: user.role === "INSTRUCTOR" ? { uploadedById: user.id } : {},
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Media Library</h1>
        <p className="text-sm text-muted-foreground">{assets.length} files</p>
        {!r2Configured && (
          <p className="mt-2 text-sm text-muted-foreground">
            Storage isn&apos;t connected yet — add Cloudflare R2 credentials to enable uploads.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => {
          const Icon = KIND_ICON[asset.kind];
          return (
            <Card key={asset.id} className="border-border/60">
              <CardContent className="p-4">
                {asset.kind === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.url}
                    alt={asset.filename}
                    className="mb-3 h-32 w-full rounded-md border border-border object-cover"
                  />
                ) : (
                  <div className="mb-3 flex h-32 w-full items-center justify-center rounded-md border border-border bg-secondary/40">
                    <Icon className="size-8 text-muted-foreground" />
                  </div>
                )}
                <p className="truncate text-sm font-medium">{asset.filename}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{asset.kind}</Badge>
                  <span>{formatSize(asset.sizeBytes)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {asset.uploadedBy.name} ·{" "}
                  {asset.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </CardContent>
            </Card>
          );
        })}
        {assets.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No media uploaded yet — upload a file from the Resources editor.
          </p>
        )}
      </div>
    </div>
  );
}
