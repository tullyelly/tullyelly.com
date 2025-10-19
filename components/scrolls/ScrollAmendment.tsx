import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ScrollAmendmentProps {
  children: ReactNode;
  className?: string;
}

/**
 * Inline callout for editorial notes within scrolls content.
 * Always prefixes the provided copy with the "scroll amendment" label.
 */
export function ScrollAmendment({ children, className }: ScrollAmendmentProps) {
  return (
    <span
      role="note"
      className={cn(
        "inline-grid grid-cols-[auto_1fr] overflow-hidden rounded-full bg-[var(--blue)] text-[var(--text-on-blue)] text-sm leading-snug md:text-base",
        className,
      )}
    >
      <span className="flex items-center bg-[var(--cream)] px-3 py-1 text-[11px] font-semibold lowercase tracking-[0.18em] text-[var(--blue)]">
        scroll amendment
      </span>
      <span className="flex items-center px-3 py-1 text-[13px] font-medium leading-snug md:text-[15px]">
        {children}
      </span>
    </span>
  );
}
