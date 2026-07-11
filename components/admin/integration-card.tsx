"use client";

import { useActionState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TestResult } from "@/lib/actions/admin-integrations";

export type FieldSpec = {
  key: string;
  label: string;
  secret?: boolean;
  placeholder?: string;
  select?: { value: string; label: string }[];
};

export function IntegrationCard({
  title,
  description,
  fields,
  existing,
  saveAction,
  deleteAction,
  testAction,
  testFields,
  testButtonLabel = "Send test",
}: {
  title: string;
  description: string;
  fields: FieldSpec[];
  existing: { config: Record<string, string>; enabled: boolean; hasSecrets: boolean } | null;
  saveAction: (formData: FormData) => void;
  deleteAction?: (formData: FormData) => void;
  testAction?: (prevState: TestResult, formData: FormData) => Promise<TestResult>;
  testFields?: FieldSpec[];
  testButtonLabel?: string;
}) {
  const [testResult, testFormAction, testPending] = useActionState(
    testAction ?? (async () => undefined),
    undefined
  );

  return (
    <Card className="border-border/60">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {existing?.enabled && <Badge>Live</Badge>}
        </div>

        <form action={saveAction} className="mt-4 space-y-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={f.key}>{f.label}</Label>
              {f.select ? (
                <select
                  id={f.key}
                  name={`config_${f.key}`}
                  defaultValue={existing?.config[f.key] ?? ""}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {f.select.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={f.key}
                  name={f.secret ? `secret_${f.key}` : `config_${f.key}`}
                  type={f.secret ? "password" : "text"}
                  placeholder={
                    f.secret && existing?.hasSecrets ? "•••• saved — leave blank to keep" : f.placeholder
                  }
                  defaultValue={f.secret ? "" : (existing?.config[f.key] ?? "")}
                />
              )}
            </div>
          ))}

          <div className="flex items-center gap-2">
            <Checkbox id={`${title}-enabled`} name="enabled" defaultChecked={existing?.enabled ?? false} />
            <Label htmlFor={`${title}-enabled`}>Enabled</Label>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" size="sm">
              Save
            </Button>
            {deleteAction && existing && (
              <Button type="submit" size="sm" variant="ghost" formAction={deleteAction}>
                Remove
              </Button>
            )}
          </div>
        </form>

        {testAction && (
          <form action={testFormAction} className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4">
            {(testFields ?? []).map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={`test-${f.key}`}>{f.label}</Label>
                <Input id={`test-${f.key}`} name={f.key} placeholder={f.placeholder} className="w-48" />
              </div>
            ))}
            <Button type="submit" size="sm" variant="outline" disabled={testPending}>
              {testPending ? "Testing…" : testButtonLabel}
            </Button>
          </form>
        )}
        {testResult && (
          <p className={`mt-2 text-sm ${testResult.success ? "text-growth" : "text-destructive"}`}>
            {testResult.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
