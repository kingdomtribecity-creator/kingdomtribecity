"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitJournalAction } from "@/lib/actions/lms";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Entry = {
  id: string;
  content: string;
  createdAt: Date;
  lesson: { title: string } | null;
};

const boundAction = submitJournalAction.bind(null, null);

export function JournalPanel({ entries }: { entries: Entry[] }) {
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-4">
      <form ref={formRef} action={formAction} className="space-y-2">
        <Textarea
          name="content"
          rows={3}
          required
          placeholder="What's on your heart today?"
        />
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Add journal entry"}
        </Button>
      </form>

      <div className="space-y-3">
        {entries.map((entry) => (
          <Card key={entry.id} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-sm leading-relaxed">{entry.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {entry.createdAt.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
                {entry.lesson ? ` · ${entry.lesson.title}` : ""}
              </p>
            </CardContent>
          </Card>
        ))}
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Your journal is empty — write your first entry above.
          </p>
        )}
      </div>
    </div>
  );
}
