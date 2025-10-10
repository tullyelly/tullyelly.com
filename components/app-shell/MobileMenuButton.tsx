"use client";

import * as React from "react";
import { Menu as MenuIcon } from "lucide-react";
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
      aria-label="Menu"
      aria-controls="nav-mobile-drawer"
      aria-expanded={mobileNavOpen}
      onClick={() => openMobileNav()}
      className={cn(
        "md:hidden inline-flex items-center justify-center h-11 min-w-11 px-3 text-base rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:h-auto md:min-w-0 md:px-0 md:text-inherit",
        className,
      )}
    >
      <MenuIcon className="size-5 shrink-0" aria-hidden="true" />
      <span className="ml-2">Menu</span>
    </button>
  );
}
