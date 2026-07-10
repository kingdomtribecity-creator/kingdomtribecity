"use client";

import { motion } from "motion/react";
import { Flame } from "lucide-react";

export function StreakBadge({ streak }: { streak: number }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2"
    >
      <Flame className={streak > 0 ? "size-4 text-primary" : "size-4 text-muted-foreground"} />
      <span className="text-sm font-semibold">{streak}</span>
      <span className="text-sm text-muted-foreground">
        day{streak === 1 ? "" : "s"} in a row
      </span>
    </motion.div>
  );
}
