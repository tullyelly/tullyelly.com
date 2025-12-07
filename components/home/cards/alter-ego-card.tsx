"use client";

import * as React from "react";
import Link from "next/link";

import { HomeCard } from "@/components/home/home-card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { InfoIcon } from "lucide-react";

export function AlterEgoCard() {
  const [open, setOpen] = React.useState(false);
  const hoverTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoverTimeout = React.useCallback(() => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  }, []);

  const handleHoverOpen = React.useCallback(() => {
    clearHoverTimeout();
    setOpen(true);
  }, [clearHoverTimeout]);

  const handleHoverClose = React.useCallback(() => {
    clearHoverTimeout();
    hoverTimeout.current = setTimeout(() => setOpen(false), 80);
  }, [clearHoverTimeout]);

  React.useEffect(
    () => () => {
      clearHoverTimeout();
    },
    [clearHoverTimeout],
  );

  const info = (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        clearHoverTimeout();
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger
        asChild
        onMouseEnter={handleHoverOpen}
        onMouseLeave={handleHoverClose}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          aria-label="About the alter egos"
        >
          <InfoIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        alignOffset={-12}
        onMouseEnter={handleHoverOpen}
        onMouseLeave={handleHoverClose}
        className="max-w-xs text-sm leading-snug"
      >
        <p>
          Each alter ego represents a different wing of the Shaolin dojo:
          architecture, data, writing, performance, and the forge where
          everything gets built. Consider this the onramp for the entire site.
        </p>
      </PopoverContent>
    </Popover>
  );

  return (
    <HomeCard title="Alter Ego Origin Stories" info={info}>
      <Link href="/mark2" className="block">
        🧠 mark2 | blueprint
      </Link>
      <Link href="/cardattack" className="block">
        🃏 cardattack | vault
      </Link>
      <Link href="/theabbott" className="block">
        🪶 theabbott | cipher
      </Link>
      <Link href="/unclejimmy" className="block">
        🎙️ unclejimmy | circus
      </Link>
      <Link href="/tullyelly" className="block">
        🛠️ tullyelly | forge
      </Link>
    </HomeCard>
  );
}
