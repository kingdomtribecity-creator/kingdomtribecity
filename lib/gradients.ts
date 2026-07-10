import type { Stage } from "@/lib/generated/prisma/enums";

/**
 * Cinematic, image-free hero backgrounds keyed by stage — used instead of
 * stock photography so every course/program hero renders consistently.
 */
export const STAGE_GRADIENT: Record<Stage, string> = {
  PLANTED:
    "linear-gradient(135deg, oklch(0.34 0.06 150) 0%, oklch(0.2 0.03 260) 65%)",
  ROOTED:
    "linear-gradient(135deg, oklch(0.3 0.07 230) 0%, oklch(0.2 0.03 260) 65%)",
  FORMED:
    "linear-gradient(135deg, oklch(0.34 0.08 300) 0%, oklch(0.2 0.03 260) 65%)",
  FRUITFUL:
    "linear-gradient(135deg, oklch(0.42 0.12 45) 0%, oklch(0.22 0.04 260) 65%)",
  SENT:
    "linear-gradient(135deg, oklch(0.58 0.14 82) 0%, oklch(0.22 0.03 260) 70%)",
};

export const BRAND_GRADIENT =
  "linear-gradient(135deg, oklch(0.58 0.14 82) 0%, oklch(0.3 0.07 230) 55%, oklch(0.2 0.03 260) 100%)";

export function stageGradient(stage: Stage): string {
  return STAGE_GRADIENT[stage];
}
