"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { InfoIcon } from "lucide-react";

type CardInfoPopoverProps = {
  ariaLabel: string;
  children: React.ReactNode;
};

export function CardInfoPopover({ ariaLabel, children }: CardInfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  }, []);

  const handleHoverOpen = useCallback(() => {
    clearHoverTimeout();
    setOpen(true);
  }, [clearHoverTimeout]);

  const handleHoverClose = useCallback(() => {
    clearHoverTimeout();
    hoverTimeout.current = setTimeout(() => setOpen(false), 80);
  }, [clearHoverTimeout]);

  useEffect(
    () => () => {
      clearHoverTimeout();
    },
    [clearHoverTimeout],
  );

  return (
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
          className="h-8 w-8 text-white hover:bg-white/10 focus-visible:ring-white leading-none [&_svg]:!h-5 [&_svg]:!w-5"
          aria-label={ariaLabel}
        >
          <InfoIcon strokeWidth={2.6} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        alignOffset={-12}
        onMouseEnter={handleHoverOpen}
        onMouseLeave={handleHoverClose}
        className="max-w-xs text-sm leading-snug border-2 bg-white px-4 py-3 shadow-none"
        style={{ borderColor: "var(--blue)" }}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
