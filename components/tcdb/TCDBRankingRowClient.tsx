"use client";

import * as React from "react";
import clsx from "clsx";

type RowClientProps = {
  id: string | number;
  name: string;
  className?: string;
  children?: React.ReactNode;
  onOpen?: (id: string | number, triggerEl: HTMLAnchorElement) => void;
};

export default function TCDBRankingRowClient({
  id,
  name,
  className,
  children,
  onOpen,
}: RowClientProps) {
  const triggerRef = React.useRef<HTMLAnchorElement | null>(null);

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (event.metaKey || event.ctrlKey || event.button === 1) {
      return;
    }
    event.preventDefault();
    triggerRef.current = event.currentTarget;
    onOpen?.(id, event.currentTarget);
  };

  return (
    <a
      href={`/cardattack/tcdb-rankings/${id}`}
      ref={triggerRef}
      data-testid="ranking-detail-trigger"
      aria-haspopup="dialog"
      aria-label={`View TCDB details for ${name}`}
      className={clsx(
        "tcdb-trigger link-blue cursor-pointer inline-flex items-center gap-2 bg-transparent p-0 text-left font-medium border-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
        className,
      )}
      onClick={handleClick}
    >
      {children ?? "View details"}
    </a>
  );
}
