import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <div className="text-primary text-sm font-semibold">{eyebrow}</div>}
        <h1 className="mt-1 text-3xl font-bold">{title}</h1>
        {description && <p className="text-muted-foreground mt-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="border-border/70 bg-card rounded-xl border p-5">
      {icon && <div className="text-primary">{icon}</div>}
      <div className="mt-3 text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-muted-foreground text-xs">{label}</div>
      {hint && <div className="text-muted-foreground mt-1 text-xs">{hint}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-border/70 rounded-xl border border-dashed p-10 text-center">
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="text-muted-foreground mt-2 text-sm">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="border-destructive/40 bg-destructive/5 rounded-xl border p-6 text-sm">
      <p className="font-medium">Something went wrong</p>
      <p className="text-muted-foreground mt-1">{message}</p>
      {onRetry && (
        <button className="text-primary mt-3 text-sm underline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
