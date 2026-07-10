import { STAGE_META, STAGE_ORDER } from "@/lib/stage";
import { cn } from "@/lib/utils";

export function PathwayStrip({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-5", className)}>
      {STAGE_ORDER.map((stage, i) => {
        const meta = STAGE_META[stage];
        return (
          <div key={stage} className="relative">
            <div className="flex items-center gap-2 sm:hidden">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary">
                {i + 1}
              </span>
              <p className="font-heading text-base font-medium">{meta.label}</p>
            </div>
            <div className="hidden sm:block">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-sm font-medium text-primary">
                {i + 1}
              </span>
              <p className="mt-3 font-heading text-lg font-medium">{meta.label}</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{meta.question}</p>
            <p className="mt-1 text-xs text-muted-foreground/80">{meta.focus}</p>
            {i < STAGE_ORDER.length - 1 && (
              <div className="absolute top-4 -right-2 hidden h-px w-4 bg-border sm:block" />
            )}
          </div>
        );
      })}
    </div>
  );
}
