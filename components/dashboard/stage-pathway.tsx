"use client";

import { motion } from "motion/react";
import { STAGE_META, STAGE_ORDER, stageIndex } from "@/lib/stage";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/generated/prisma/enums";

export function StagePathway({ stage }: { stage: Stage }) {
  const currentIndex = stageIndex(stage);

  return (
    <div className="flex items-start gap-1 overflow-x-auto pb-2 sm:gap-2">
      {STAGE_ORDER.map((s, i) => {
        const meta = STAGE_META[s];
        const isCurrent = i === currentIndex;
        const isDone = i < currentIndex;
        return (
          <div key={s} className="flex min-w-[92px] flex-1 flex-col items-center text-center sm:min-w-0">
            <motion.div
              initial={false}
              animate={{ scale: isCurrent ? 1.08 : 1 }}
              className={cn(
                "flex size-11 items-center justify-center rounded-full border-2 text-sm font-semibold",
                isCurrent
                  ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_6px_var(--color-primary)/15]"
                  : isDone
                    ? "border-growth/40 bg-growth/15 text-growth"
                    : "border-border bg-secondary text-muted-foreground"
              )}
            >
              {i + 1}
            </motion.div>
            <p
              className={cn(
                "mt-2 text-xs font-medium sm:text-sm",
                isCurrent ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {meta.label}
            </p>
            {i < STAGE_ORDER.length - 1 && (
              <div className="mt-1 hidden h-px w-full bg-border sm:block" />
            )}
          </div>
        );
      })}
    </div>
  );
}
