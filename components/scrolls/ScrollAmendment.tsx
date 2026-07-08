import { type ReactNode } from "react";

import { ScrollCallout } from "@/components/scrolls/ScrollCallout";

interface ScrollAmendmentProps {
  children: ReactNode;
  className?: string;
}

const scrollAmendmentBodyClassName =
  "bg-[var(--blue)] text-[color:var(--text-on-blue)] [&_a]:!text-white [&_a:hover]:bg-white [&_a:hover]:!text-[color:var(--blue)] [&_a:focus-visible]:outline-white [&_[data-person-tag]]:!text-[color:var(--text-on-blue)] [&_ul>li]:marker:text-[color:var(--text-on-blue)]";

const scrollAmendmentLabelClassName = "text-[color:var(--ink)]";

const scrollAmendmentLabelStyle = {
  backgroundColor: "var(--cream)",
};

/**
 * Inline callout for editorial notes within scrolls content.
 * Uses a release-style tab label with Cream City Cream + black text while keeping the body Great Lakes Blue with white text.
 */
export function ScrollAmendment({ children, className }: ScrollAmendmentProps) {
  return (
    <ScrollCallout
      data-scroll-amendment
      label="scroll amendment"
      bodyClassName={scrollAmendmentBodyClassName}
      labelClassName={scrollAmendmentLabelClassName}
      labelStyle={scrollAmendmentLabelStyle}
      className={className}
    >
      {children}
    </ScrollCallout>
  );
}
