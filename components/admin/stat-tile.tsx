import { Card, CardContent } from "@/components/ui/card";

export function StatTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1.5 text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
