import Image from "next/image";
import { stageGradient } from "@/lib/gradients";
import { STAGE_META } from "@/lib/stage";
import { Badge } from "@/components/ui/badge";
import type { Stage } from "@/lib/generated/prisma/enums";

export function CourseHero({
  title,
  subtitle,
  stage,
  coverImage,
}: {
  title: string;
  subtitle: string | null;
  stage: Stage;
  /** Optional real photograph — falls back to the stage gradient treatment when absent. */
  coverImage?: string | null;
}) {
  return (
    <div
      className="relative flex min-h-56 flex-col justify-end overflow-hidden rounded-2xl p-8 text-white sm:p-10"
      style={coverImage ? undefined : { backgroundImage: stageGradient(stage) }}
    >
      {coverImage && (
        <>
          <Image src={coverImage} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        </>
      )}
      <div className="relative">
        <Badge variant="secondary" className="w-fit bg-white/15 text-white">
          {STAGE_META[stage].label} · {STAGE_META[stage].question}
        </Badge>
        <h1 className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-white/85">{subtitle}</p>}
      </div>
    </div>
  );
}
