"use client";

import * as React from "react";
import { Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommandMenu } from "@/components/nav/CommandMenu";

type SearchButtonProps = {
  variant?: "default" | "compact";
  className?: string;
};

export default function SearchButton({
  variant = "default",
  className,
}: SearchButtonProps) {
  const { setOpen } = useCommandMenu();

  const handleClick = React.useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  if (variant === "compact") {
    return (
      <button
        type="button"
        aria-label="Open search"
        onClick={handleClick}
        className={cn(
          "hit-target inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/10 px-3 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
          className,
        )}
      >
        <Command className="size-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "hit-target inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
        className,
      )}
    >
      <Command className="size-4" aria-hidden="true" />
      <span>Search</span>
      <span className="hidden text-xs opacity-75 lg:inline">⌘K</span>
    </button>
  );
}
