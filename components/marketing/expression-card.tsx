import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PROGRAM_PHOTO, PHOTOGRAPHY } from "@/lib/photography";

type ExpressionCardData = {
  slug: string;
  name: string;
  tagline: string;
  description?: string;
  heroImage: string | null;
};

export function ExpressionCard({
  program,
  courseCount,
  compact,
}: {
  program: ExpressionCardData;
  courseCount?: number;
  compact?: boolean;
}) {
  return (
    <Card className="overflow-hidden border-border/60 py-0">
      <div className={compact ? "relative h-28" : "relative h-40"}>
        <Image
          src={program.heroImage || PROGRAM_PHOTO[program.slug] || PHOTOGRAPHY.community}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <CardContent className="p-6">
        <p className="font-heading text-lg font-medium">{program.name}</p>
        <p className="mt-2 text-sm text-muted-foreground">{program.tagline}</p>
        {!compact && program.description && (
          <p className="mt-3 text-sm text-muted-foreground/90">{program.description}</p>
        )}
        {typeof courseCount === "number" && courseCount > 0 && (
          <p className="mt-4 text-xs text-muted-foreground">
            {courseCount} course{courseCount === 1 ? "" : "s"} available
          </p>
        )}
        {!compact && (
          <Button className="mt-5" variant="outline" asChild>
            <Link href={`/expressions/${program.slug}`}>Explore</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
