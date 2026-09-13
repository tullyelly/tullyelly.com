import type { ReactNode } from "react";

import { Card } from "@ui";
import { cn } from "@/lib/utils";

type StatVariant = "card" | "hero" | "segmented";

const COLUMN_CLASSES = {
  2: "grid-cols-2",
  3: "grid-cols-1 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 xl:grid-cols-5",
} as const;

export function StatGrid({
  children,
  columns = 3,
  variant = "card",
  className,
  ariaLabel,
}: {
  children: ReactNode;
  columns?: keyof typeof COLUMN_CLASSES;
  variant?: StatVariant;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <dl
      aria-label={ariaLabel}
      className={cn(
        "grid",
        COLUMN_CLASSES[columns],
        variant === "card" && "gap-3",
        variant === "hero" &&
          "gap-px overflow-hidden rounded-xl border border-white/15 bg-white/15",
        variant === "segmented" &&
          "gap-px overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--border-subtle)]",
        className,
      )}
    >
      {children}
    </dl>
  );
}

export function Stat({
  label,
  value,
  variant = "card",
  className,
  labelClassName,
  valueClassName,
}: {
  label: ReactNode;
  value: ReactNode;
  variant?: StatVariant;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  const content = (
    <>
      <dt
        className={cn(
          "text-[0.68rem] font-semibold uppercase leading-tight tracking-[0.16em]",
          variant === "hero" ? "opacity-75" : "text-ink/60",
          labelClassName,
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1.5 font-semibold leading-snug tabular-nums",
          variant === "hero" ? "text-sm" : "text-lg text-ink md:text-xl",
          valueClassName,
        )}
      >
        {value}
      </dd>
    </>
  );

  if (variant === "card") {
    return (
      <Card as="div" className={cn("p-3 md:p-4", className)}>
        {content}
      </Card>
    );
  }

  return (
    <div
      className={cn(
        variant === "hero"
          ? "bg-black/10 px-3.5 py-3 md:px-4 md:py-3.5"
          : "min-w-0 bg-[color:var(--surface-card)] px-3 py-3 sm:px-4",
        className,
      )}
    >
      {content}
    </div>
  );
}
