"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  postPrayerRequestAction,
  markPrayerAnsweredAction,
} from "@/lib/actions/community";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

type Prayer = {
  id: string;
  body: string;
  status: "OPEN" | "ANSWERED";
  createdAt: Date;
  userId: string;
  user: { name: string | null };
};

export function PrayerRequestList({
  tribeSlug,
  prayers,
  canModerate,
  currentUserId,
}: {
  tribeSlug: string;
  prayers: Prayer[];
  canModerate: boolean;
  currentUserId: string;
}) {
  const boundAction = postPrayerRequestAction.bind(null, tribeSlug);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.error) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-6">
      <form ref={formRef} action={formAction} className="space-y-2">
        <Textarea name="body" rows={2} required placeholder="Share a prayer request..." />
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Sharing…" : "Share prayer request"}
        </Button>
      </form>

      <div className="space-y-3">
        {prayers.map((p) => (
          <div key={p.id} className="rounded-lg border border-border/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{p.user.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
              </div>
              {p.status === "ANSWERED" ? (
                <Badge variant="secondary" className="shrink-0 gap-1 text-growth">
                  <CheckCircle2 className="size-3" /> Answered
                </Badge>
              ) : (
                (canModerate || p.userId === currentUserId) && (
                  <form action={markPrayerAnsweredAction.bind(null, p.id, tribeSlug)}>
                    <Button type="submit" size="sm" variant="ghost">
                      Mark answered
                    </Button>
                  </form>
                )
              )}
            </div>
          </div>
        ))}
        {prayers.length === 0 && (
          <p className="text-sm text-muted-foreground">No prayer requests yet.</p>
        )}
      </div>
    </div>
  );
}
