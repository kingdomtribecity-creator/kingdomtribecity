"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTribeMentorAction } from "@/lib/actions/admin";

export function TribeMentorSelect({
  tribeId,
  mentorId,
  mentors,
}: {
  tribeId: string;
  mentorId: string | null;
  mentors: { id: string; name: string | null }[];
}) {
  const [, startTransition] = useTransition();

  return (
    <Select
      defaultValue={mentorId ?? undefined}
      onValueChange={(v) => startTransition(() => updateTribeMentorAction(tribeId, v))}
    >
      <SelectTrigger size="sm" className="w-full">
        <SelectValue placeholder="Assign mentor" />
      </SelectTrigger>
      <SelectContent>
        {mentors.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
