import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Card } from "@ui";
import { cn } from "@/lib/utils";

export function MobileDataCard({
  className,
  ...props
}: ComponentPropsWithoutRef<"li">) {
  return (
    <Card
      as="li"
      className={cn("overflow-hidden p-4 shadow-sm", className)}
      {...props}
    />
  );
}

export function MobileDataCardHeader({
  eyebrow,
  title,
  description,
  trailing,
  className,
  eyebrowClassName,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  eyebrowClassName?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0 space-y-1">
        {eyebrow ? (
          <p
            className={cn(
              "!m-0 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/60",
              eyebrowClassName,
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <div className="min-w-0 font-semibold leading-tight">{title}</div>
        {description ? (
          <div className="text-sm leading-snug text-ink/70">{description}</div>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

export function MobileDataGrid({
  className,
  ...props
}: ComponentPropsWithoutRef<"dl">) {
  return (
    <dl
      className={cn("mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm", className)}
      {...props}
    />
  );
}

export function MobileDataField({
  label,
  children,
  className,
  labelClassName,
  valueClassName,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className={className}>
      <dt
        className={cn(
          "text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/60",
          labelClassName,
        )}
      >
        {label}
      </dt>
      <dd className={cn("mt-1 text-ink", valueClassName)}>{children}</dd>
    </div>
  );
}

export function MobileDataEmptyState({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"li">) {
  return (
    <Card
      as="li"
      className={cn(
        "border-dashed p-4 text-sm leading-6 text-ink/70 shadow-none",
        className,
      )}
      {...props}
    >
      {children}
    </Card>
  );
}
