import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function Field({
  label,
  name,
  hint,
  children,
  required,
  className,
  error,
}: {
  label: string;
  name?: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
  error?: string[] | string;
}) {
  const errs = error
    ? Array.isArray(error)
      ? error
      : [error]
    : undefined;
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {errs && errs.length > 0 ? (
        <p className="text-[11px] text-destructive">{errs.join(", ")}</p>
      ) : (
        hint && <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function FormError({
  state,
}: {
  state: { ok: true } | { ok: false; errors: Record<string, string[] | undefined>; message?: string };
}) {
  if (state.ok) return null;
  const general = state.message ?? state.errors._form?.join(", ");
  if (!general) return null;
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {general}
    </div>
  );
}
