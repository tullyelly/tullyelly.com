"use client";

import * as React from "react";
import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppShell } from "./context";

type PersonaSwitcherButtonProps = {
  className?: string;
};

function PersonaIcon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  if (!name) return null;
  const maybeIcon = Lucide[name as keyof typeof Lucide];
  if (typeof maybeIcon !== "function") return null;
  const IconComponent = maybeIcon as LucideIcon;
  return <IconComponent className={className} aria-hidden="true" />;
}

export default function PersonaSwitcherButton({
  className,
}: PersonaSwitcherButtonProps) {
  const { currentPersona, siteTitle, openMobileNav, mobileNavOpen } =
    useAppShell();

  const label = currentPersona?.label ?? siteTitle;
  const personaId = currentPersona?.id ?? null;

  const handleClick = React.useCallback(() => {
    openMobileNav({ personaId });
  }, [openMobileNav, personaId]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        currentPersona
          ? `Show navigation for ${currentPersona.label}`
          : "Show navigation"
      }
      aria-controls="nav-mobile-drawer"
      aria-expanded={mobileNavOpen}
      className={cn(
        "hit-target flex flex-1 items-center justify-center gap-2 truncate rounded-xl border border-white/30 bg-white/10 px-3 text-sm font-medium text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
        "min-w-0 text-center",
        className,
      )}
    >
      <PersonaIcon name={currentPersona?.icon} className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}
