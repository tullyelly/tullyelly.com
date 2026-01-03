import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ScrollAmendmentProps {
  children: ReactNode;
  className?: string;
}

/**
 * Inline callout for editorial notes within scrolls content.
 * Uses a release-style tab label with Cream City Cream + black text while keeping the body Great Lakes Blue with white text.
 */
export function ScrollAmendment({ children, className }: ScrollAmendmentProps) {
  return (
    <span
      role="note"
      className={cn(
        "relative block w-full rounded-lg bg-[var(--blue)] px-4 py-4 text-[13px] font-medium leading-snug text-[var(--text-on-blue)] shadow-sm md:px-5 md:py-5 md:text-[15px] [&_a]:rounded [&_a]:px-1 [&_a]:!text-white [&_a]:underline [&_a]:transition-colors [&_a]:duration-150 [&_a:hover]:bg-white [&_a:hover]:!text-[var(--blue)] [&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-white [&_ul>li]:marker:text-[color:var(--text-on-blue)]",
        className,
      )}
    >
      <span
        className="absolute left-0 top-0 inline-flex items-center rounded-tl-lg rounded-tr-none px-4 py-1 text-sm font-semibold leading-none text-[color:var(--ink,_#0c1b0c)] shadow-sm md:px-5"
        style={{ backgroundColor: "var(--cream)" }}
      >
        scroll amendment
      </span>
      <span className="block pt-1.5 md:pt-2">{children}</span>
    </span>
  );
}
