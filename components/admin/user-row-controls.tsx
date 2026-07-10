"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserRoleAction, updateUserStageAction } from "@/lib/actions/admin";
import { STAGE_ORDER, STAGE_META } from "@/lib/stage";
import type { Role, Stage } from "@/lib/generated/prisma/enums";

const ROLES: Role[] = ["GUEST", "STUDENT", "MENTOR", "ADMIN"];

export function UserRowControls({
  userId,
  role,
  stage,
}: {
  userId: string;
  role: Role;
  stage: Stage;
}) {
  const [, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Select
        defaultValue={role}
        onValueChange={(v) =>
          startTransition(() => updateUserRoleAction(userId, v as Role))
        }
      >
        <SelectTrigger size="sm" className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={stage}
        onValueChange={(v) =>
          startTransition(() => updateUserStageAction(userId, v as Stage))
        }
      >
        <SelectTrigger size="sm" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STAGE_ORDER.map((s) => (
            <SelectItem key={s} value={s}>
              {STAGE_META[s].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
