import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DataToolbarProps = {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  result?: ReactNode;
  ariaLabel?: string;
  className?: string;
};

export default function DataToolbar({
  search,
  filters,
  actions,
  result,
  ariaLabel = "Data controls",
  className,
}: DataToolbarProps) {
  const hasControls = search || filters || actions;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "rounded-xl border border-[color:var(--border-subtle)] bg-white/70 p-3 shadow-sm",
        className,
      )}
    >
      {hasControls ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {search ? <div className="min-w-0 lg:flex-1">{search}</div> : null}
          {filters || actions ? (
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
              {filters}
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
      {result ? (
        <div
          className={cn(
            hasControls
              ? "mt-3 border-t border-[color:var(--border-subtle)] pt-2.5"
              : undefined,
          )}
        >
          {result}
        </div>
      ) : null}
    </div>
  );
}

export function DataResultCount({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn("text-sm text-ink/70", className)}
    >
      {children}
    </p>
  );
}
