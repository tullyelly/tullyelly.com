"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useCommandMenu } from "./CommandMenu";

export default function DesktopSearchTrigger() {
  const { open, setOpen } = useCommandMenu();

  return (
    <button
      type="button"
      aria-label="Search tullyelly"
      aria-expanded={open}
      onClick={() => setOpen(true)}
      data-testid="nav-desktop-search"
      className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 text-sm font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <span className="hidden xl:inline 2xl:hidden">Search</span>
      <span className="hidden 2xl:inline">Search tullyelly</span>
      <kbd
        className="ml-1 hidden rounded border border-white/25 bg-black/10 px-1.5 py-0.5 font-sans text-[11px] font-normal text-white/80 2xl:inline"
        aria-hidden="true"
      >
        ⌘K
      </kbd>
    </button>
  );
}
