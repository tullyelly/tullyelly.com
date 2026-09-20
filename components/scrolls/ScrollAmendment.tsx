import { type ReactNode } from "react";

import { ScrollCallout } from "@/components/scrolls/ScrollCallout";

interface ScrollAmendmentProps {
  children: ReactNode;
  className?: string;
  date: string;
}

const scrollAmendmentBodyClassName =
  "bg-[var(--blue)] [&_a:focus-visible]:outline-white";

const scrollAmendmentContentClassName =
  "!text-[color:var(--text-on-blue)] [&_*]:!text-[color:var(--text-on-blue)] [&_a]:bg-white [&_a]:!text-[color:var(--blue)] [&_a:hover]:bg-[var(--cream)] [&_a:hover]:!text-[color:var(--blue)] [&_[data-person-tag]]:bg-white [&_[data-person-tag]]:!text-[color:var(--blue)] [&_ul>li]:marker:text-[color:var(--text-on-blue)]";

const scrollAmendmentLabelClassName = "text-[color:var(--ink)]";

const scrollAmendmentLabelStyle = {
  backgroundColor: "var(--cream)",
};

/**
 * Inline callout for editorial notes within scrolls content.
 * Uses a release-style tab label with Cream City Cream + black text while keeping the body Great Lakes Blue with white text.
 */
export function ScrollAmendment({
  children,
  className,
  date,
}: ScrollAmendmentProps) {
  return (
    <ScrollCallout
      data-scroll-amendment
      label={`scroll amendment · ${date}`}
      bodyClassName={scrollAmendmentBodyClassName}
      labelClassName={scrollAmendmentLabelClassName}
      labelStyle={scrollAmendmentLabelStyle}
      contentClassName={scrollAmendmentContentClassName}
      className={className}
    >
      {children}
    </ScrollCallout>
  );
}
