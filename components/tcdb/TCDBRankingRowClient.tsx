"use client";

import * as React from "react";
import clsx from "clsx";

type RowClientProps = {
  href: string;
  name: string;
  className?: string;
  children?: React.ReactNode;
};

export default function TCDBRankingRowClient({
  href,
  name,
  className,
  children,
}: RowClientProps) {
  const triggerRef = React.useRef<HTMLAnchorElement | null>(null);

  return (
    <a
      href={href}
      ref={triggerRef}
      data-testid="ranking-detail-trigger"
      aria-label={`View TCDB details for ${name}`}
      className={clsx(
        "tcdb-trigger link-blue cursor-pointer inline-flex items-center gap-2 bg-transparent p-0 text-left font-medium border-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
        className,
      )}
    >
      {children ?? "View details"}
    </a>
  );
}
