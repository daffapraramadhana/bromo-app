import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  intent?: "default" | "warning" | "danger" | "success";
};

const INTENT: Record<NonNullable<KpiCardProps["intent"]>, string> = {
  default: "",
  warning: "text-amber-600",
  danger: "text-red-600",
  success: "text-emerald-600",
};

export function KpiCard({ label, value, hint, intent = "default" }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-semibold tabular-nums", INTENT[intent])}>
          {value}
        </div>
        {hint && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}
