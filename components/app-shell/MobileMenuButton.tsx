"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppShell } from "./context";

type MobileMenuButtonProps = {
  className?: string;
};

export default function MobileMenuButton({ className }: MobileMenuButtonProps) {
  const { mobileNavOpen, openMobileNav } = useAppShell();

  return (
    <button
      type="button"
      aria-label="Open menu"
      aria-controls="nav-mobile-drawer"
      aria-expanded={mobileNavOpen}
      onClick={() => openMobileNav()}
      className={cn(
        "hit-target inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-3 text-sm font-medium text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
        className,
      )}
    >
      <Menu className="size-4 shrink-0" aria-hidden="true" />
      <span>Menu</span>
    </button>
  );
}
