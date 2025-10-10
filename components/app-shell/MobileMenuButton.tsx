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
        "md:hidden inline-flex items-center justify-center gap-2 rounded-full",
        "h-11 min-h-[44px] px-4 leading-none text-base",
        "border border-white/20 bg-white/10 text-white transition hover:bg-white/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:h-auto md:min-h-0 md:px-0 md:text-inherit",
        className,
      )}
    >
      <MenuIcon className="size-5 shrink-0" aria-hidden="true" />
      <span className="font-medium align-middle">Menu</span>
    </button>
  );
}
