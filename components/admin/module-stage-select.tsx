"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateModuleStageAction } from "@/lib/actions/admin";
import { STAGE_ORDER, STAGE_META } from "@/lib/stage";
import type { Stage } from "@/lib/generated/prisma/enums";

const NONE = "__none__";

export function ModuleStageSelect({
  moduleId,
  courseId,
  stage,
}: {
  moduleId: string;
  courseId: string;
  stage: Stage | null;
}) {
  const [, startTransition] = useTransition();

  return (
    <Select
      defaultValue={stage ?? NONE}
      onValueChange={(v) =>
        startTransition(() =>
          updateModuleStageAction(moduleId, courseId, v === NONE ? "" : (v as Stage))
        )
      }
    >
      <SelectTrigger size="sm" className="w-40">
        <SelectValue placeholder="No stage" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>No stage</SelectItem>
        {STAGE_ORDER.map((s) => (
          <SelectItem key={s} value={s}>
            Forms: {STAGE_META[s].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
