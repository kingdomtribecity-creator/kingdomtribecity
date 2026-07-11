import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { stageGradient } from "@/lib/gradients";
import { STAGE_META } from "@/lib/stage";
import type { Stage } from "@/lib/generated/prisma/enums";

type CourseCardData = {
  slug: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  stage: Stage | null;
  pricingType: string;
  priceCents: number | null;
};

export function CourseCard({
  course,
  programName,
}: {
  course: CourseCardData;
  programName?: string;
}) {
  return (
    <Link href={`/learn/${course.slug}`}>
      <Card className="h-full overflow-hidden border-border/60 py-0 transition-colors hover:border-primary/40">
        <div
          className="flex h-28 flex-col justify-between p-4"
          style={{ backgroundImage: stageGradient(course.stage) }}
        >
          <Badge variant="secondary" className="w-fit bg-white/15 text-white">
            {programName ?? category(course)}
          </Badge>
          {course.stage && (
            <Badge variant="secondary" className="w-fit bg-white/15 text-white">
              {STAGE_META[course.stage].label}
            </Badge>
          )}
        </div>
        <CardContent className="p-6">
          <p className="font-heading text-lg font-medium">{course.title}</p>
          {course.subtitle && (
            <p className="mt-2 text-sm text-muted-foreground">{course.subtitle}</p>
          )}
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            {course.category && <span>{course.category}</span>}
            {course.pricingType === "PAID" && (
              <Badge variant="outline">${((course.priceCents ?? 0) / 100).toFixed(0)}</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function category(course: CourseCardData): string {
  return course.category ?? "Course";
}
