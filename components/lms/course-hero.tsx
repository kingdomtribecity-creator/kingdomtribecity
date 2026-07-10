import { stageGradient } from "@/lib/gradients";
import { STAGE_META } from "@/lib/stage";
import { Badge } from "@/components/ui/badge";
import type { Stage } from "@/lib/generated/prisma/enums";

export function CourseHero({
  title,
  subtitle,
  stage,
}: {
  title: string;
  subtitle: string | null;
  stage: Stage;
}) {
  return (
    <div
      className="flex min-h-56 flex-col justify-end rounded-2xl p-8 text-white sm:p-10"
      style={{ backgroundImage: stageGradient(stage) }}
    >
      <Badge variant="secondary" className="w-fit bg-white/15 text-white">
        {STAGE_META[stage].label} · {STAGE_META[stage].question}
      </Badge>
      <h1 className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-xl text-white/85">{subtitle}</p>}
    </div>
  );
}
