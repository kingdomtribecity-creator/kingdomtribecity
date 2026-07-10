import type { Stage } from "@/lib/generated/prisma/enums";

export const STAGE_ORDER: Stage[] = [
  "PLANTED",
  "ROOTED",
  "FORMED",
  "FRUITFUL",
  "SENT",
];

export const STAGE_META: Record<
  Stage,
  { label: string; question: string; focus: string }
> = {
  PLANTED: {
    label: "Planted",
    question: "Who am I in Christ?",
    focus: "Identity foundation",
  },
  ROOTED: {
    label: "Rooted",
    question: "How do I know Him?",
    focus: "Intimacy — prayer, Word, obedience",
  },
  FORMED: {
    label: "Formed",
    question: "Who am I becoming?",
    focus: "Character, renewal, discipline, maturity",
  },
  FRUITFUL: {
    label: "Fruitful",
    question: "What am I made to do?",
    focus: "Purpose, gifts, calling, assignment",
  },
  SENT: {
    label: "Sent",
    question: "Where do I carry Him?",
    focus: "Influence in every sphere",
  },
};

export function nextStage(stage: Stage): Stage | null {
  const idx = STAGE_ORDER.indexOf(stage);
  return idx >= 0 && idx < STAGE_ORDER.length - 1
    ? STAGE_ORDER[idx + 1]
    : null;
}

export function stageIndex(stage: Stage): number {
  return STAGE_ORDER.indexOf(stage);
}
