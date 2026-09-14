import { useId, type ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Card } from "./Card";

type PageStateProps = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  visual?: ReactNode;
  actions?: ReactNode;
  role?: "alert" | "status";
  className?: string;
};

export function PageState({
  title,
  description,
  eyebrow,
  visual,
  actions,
  role,
  className,
}: PageStateProps) {
  const id = useId();
  const headingId = `${id}-heading`;
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className="flex min-h-[50vh] items-center justify-center py-8 sm:py-12">
      <Card
        as="section"
        accent="great-lakes-blue"
        className={cn("w-full max-w-xl p-6 text-center sm:p-8", className)}
        role={role}
        aria-live={
          role === "alert"
            ? "assertive"
            : role === "status"
              ? "polite"
              : undefined
        }
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
      >
        {visual ? (
          <div aria-hidden="true" className="mb-4 flex justify-center">
            {visual}
          </div>
        ) : null}
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--blue)]">
            {eyebrow}
          </p>
        ) : null}
        <h1
          id={headingId}
          className={cn(
            "text-2xl font-semibold text-ink sm:text-3xl",
            eyebrow && "mt-2",
          )}
        >
          {title}
        </h1>
        {description ? (
          <div
            id={descriptionId}
            className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink/75 sm:text-base"
          >
            {description}
          </div>
        ) : null}
        {actions ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {actions}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
