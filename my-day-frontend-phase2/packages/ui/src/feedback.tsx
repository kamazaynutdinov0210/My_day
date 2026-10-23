import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn.js";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-raised motion-reduce:animate-none", className)} {...props} />;
}

export function Progress({ value, label, className }: { value: number; label: string; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-raised", className)}>
      <div className="h-full rounded-full bg-accent" style={{ width: `${v}%` }} />
    </div>
  );
}

/** Empty and error states tell the person what happened and what to do next. */
export function StateMessage({ title, hint, action, tone = "empty" }: {
  title: string; hint?: string; action?: ReactNode; tone?: "empty" | "error";
}) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className="flex flex-col items-start gap-1 py-4">
      <p className={cn("text-sm font-medium", tone === "error" ? "text-bad" : "text-fg")}>{title}</p>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
