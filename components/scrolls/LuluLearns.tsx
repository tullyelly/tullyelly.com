import { type ReactNode } from "react";

import { ScrollCallout } from "@/components/scrolls/ScrollCallout";

interface LuluLearnsProps {
  children: ReactNode;
  className?: string;
}

const luluBodyClassName =
  "bg-[color:var(--lulu-surface)] bg-linear-to-br from-[var(--lulu-surface)] to-[var(--lulu-surface-soft)] ring-1 ring-inset ring-[color:var(--lulu-border)] [&_a:focus-visible]:outline-[var(--lulu-plum)]";

const luluContentClassName =
  "!text-[color:var(--lulu-plum)] [&_*]:!text-[color:var(--lulu-plum)] [&_a]:!text-[color:var(--lulu-plum)] [&_a:hover]:bg-[var(--lulu-plum)] [&_a:hover]:!text-white [&_ul>li]:marker:text-[color:var(--lulu-plum)] [&_ol>li]:marker:text-[color:var(--lulu-plum)]";

export function LuluLearns({ children, className }: LuluLearnsProps) {
  return (
    <ScrollCallout
      data-lulu-learns
      label="lulu learns"
      bodyClassName={luluBodyClassName}
      contentClassName={luluContentClassName}
      labelClassName="text-[color:var(--white)]"
      labelStyle={{ backgroundColor: "var(--lulu-plum)" }}
      className={className}
    >
      {children}
    </ScrollCallout>
  );
}
