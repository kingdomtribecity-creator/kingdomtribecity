"use client";

import { useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { togglePermissionAction } from "@/lib/actions/admin";
import type { Role } from "@/lib/generated/prisma/enums";

export function PermissionToggle({
  role,
  permissionId,
  enabled,
  disabled,
}: {
  role: Role;
  permissionId: string;
  enabled: boolean;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Checkbox
      checked={enabled}
      disabled={disabled || pending}
      onCheckedChange={(checked) =>
        startTransition(() => togglePermissionAction(role, permissionId, Boolean(checked)))
      }
    />
  );
}
