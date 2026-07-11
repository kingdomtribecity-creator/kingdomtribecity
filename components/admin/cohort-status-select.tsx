"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateCohortStatusAction } from "@/lib/actions/admin";
import type { CohortStatus } from "@/lib/generated/prisma/enums";

const LABEL: Record<CohortStatus, string> = {
  UPCOMING: "Upcoming",
  ACTIVE: "Active",
  COMPLETED: "Completed",
};

export function CohortStatusSelect({
  cohortId,
  courseId,
  status,
}: {
  cohortId: string;
  courseId: string;
  status: CohortStatus;
}) {
  const [, startTransition] = useTransition();

  return (
    <Select
      defaultValue={status}
      onValueChange={(v) =>
        startTransition(() => updateCohortStatusAction(cohortId, courseId, v as CohortStatus))
      }
    >
      <SelectTrigger size="sm" className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(LABEL).map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
