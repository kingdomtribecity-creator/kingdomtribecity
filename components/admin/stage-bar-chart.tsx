import { STAGE_META, STAGE_ORDER } from "@/lib/stage";
import type { Stage } from "@/lib/generated/prisma/enums";

export function StageBarChart({ counts }: { counts: Record<Stage, number> }) {
  const max = Math.max(1, ...STAGE_ORDER.map((s) => counts[s]));

  return (
    <div className="space-y-3">
      {STAGE_ORDER.map((stage) => {
        const value = counts[stage];
        const pct = (value / max) * 100;
        return (
          <div key={stage} className="flex items-center gap-3">
            <p className="w-24 shrink-0 text-sm text-muted-foreground">
              {STAGE_META[stage].label}
            </p>
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}
              />
            </div>
            <p className="w-8 shrink-0 text-right text-sm font-medium tabular-nums">
              {value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
