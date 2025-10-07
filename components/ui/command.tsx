"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { useTopAnchor } from "@/components/hooks/useTopAnchor";
import { useLeftAnchor } from "@/components/hooks/useLeftAnchor";

const DIALOG_MARGIN = 16;
const WIDTH_CAP = 720;
const DESKTOP_MIN_WIDTH = 600;
const TABLET_MIN_WIDTH = 440;
const BREAKPOINT_TABLET = 640;
const BREAKPOINT_DESKTOP = 1024;
const TABLET_RATIO = 0.9;

export const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-visible rounded-b-2xl rounded-t-none",
      "px-4 py-4 sm:px-6 md:px-8 lg:px-10",
      className,
    )}
    {...props}
  />
));
Command.displayName = "Command";

type CommandDialogProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  children: React.ReactNode;
  className?: string;
};

export function CommandDialog({
  open,
  onOpenChange,
  children,
  className,
}: CommandDialogProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const topPx = useTopAnchor();
  const {
    left: leftPx,
    width: widthPx,
    compute: recomputeLeft,
  } = useLeftAnchor({
    anchorSelector: "#content-pane",
    margin: DIALOG_MARGIN,
    fallbackWidth: 640,
  });

  const [viewportWidth, setViewportWidth] = React.useState<number>(0);

  React.useEffect(() => {
    const updateViewport = () => setViewportWidth(window.innerWidth || 0);
    updateViewport();
    window.addEventListener("resize", updateViewport, { passive: true });
    window.addEventListener("orientationchange", updateViewport);
    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
    };
  }, []);

  const dialogWidth = React.useMemo(() => {
    if (!Number.isFinite(widthPx) || widthPx <= 0) return undefined;
    if (viewportWidth <= 0) return Math.round(widthPx);

    if (viewportWidth < BREAKPOINT_TABLET) {
      return Math.round(widthPx);
    }

    if (viewportWidth < BREAKPOINT_DESKTOP) {
      const ninety = Math.min(widthPx * TABLET_RATIO, WIDTH_CAP);
      const lowerBound = Math.min(widthPx, TABLET_MIN_WIDTH);
      const finalWidth = Math.min(widthPx, Math.max(ninety, lowerBound));
      return Math.round(finalWidth);
    }

    const capped = Math.min(widthPx, WIDTH_CAP);
    const comfortable =
      widthPx >= DESKTOP_MIN_WIDTH
        ? Math.min(widthPx, Math.max(capped, DESKTOP_MIN_WIDTH))
        : capped;
    return Math.round(comfortable);
  }, [viewportWidth, widthPx]);

  React.useEffect(() => {
    if (contentRef.current) {
      recomputeLeft(contentRef.current);
    }
  }, [recomputeLeft, open, dialogWidth]);

  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const stableWidth =
      typeof dialogWidth === "number" &&
      Number.isFinite(dialogWidth) &&
      dialogWidth > 0
        ? dialogWidth
        : null;
    const widthStyle = stableWidth
      ? (["width", `${stableWidth}px`] as [string, string])
      : null;
    const targetStyles: Array<[string, string]> = [
      ["position", "fixed"],
      ["top", `${Math.max(topPx - 8, 0)}px`],
      ["left", `${leftPx}px`],
      ["right", "auto"],
      ["bottom", "auto"],
      ["transform", "none"],
      ["max-width", `calc(100vw - ${DIALOG_MARGIN * 2}px)`],
    ];
    if (widthStyle) targetStyles.push(widthStyle);

    const guardClasses = [
      "left-1/2",
      "-translate-x-1/2",
      "top-1/2",
      "-translate-y-1/2",
      "bottom-0",
      "items-end",
      "justify-end",
      "data-[state=open]:slide-in-from-bottom",
      "sm:items-end",
    ];

    const enforce = () => {
      let changed = false;
      for (const [prop, value] of targetStyles) {
        if (el.style.getPropertyValue(prop) !== value) {
          el.style.setProperty(prop, value);
          changed = true;
        }
      }
      if (!widthStyle && el.style.getPropertyValue("width")) {
        el.style.removeProperty("width");
        changed = true;
      }
      for (const cls of guardClasses) {
        if (el.classList.contains(cls)) {
          el.classList.remove(cls);
          changed = true;
        }
      }
      return changed;
    };

    const apply = () => {
      const changed = enforce();
      if (changed) {
        recomputeLeft(el);
      }
    };

    apply();

    const mo = new MutationObserver(apply);
    mo.observe(el, { attributes: true, attributeFilter: ["class", "style"] });

    const ro = new ResizeObserver(() => {
      recomputeLeft(el);
      enforce();
    });
    ro.observe(el);

    return () => {
      mo.disconnect();
      ro.disconnect();
    };
  }, [dialogWidth, leftPx, topPx, recomputeLeft]);

  React.useEffect(() => {
    if (!open) return;

    const allowInside = (target: EventTarget | null) =>
      !!(
        contentRef.current &&
        target instanceof Node &&
        contentRef.current.contains(target)
      );

    const stopWheel = (event: WheelEvent) => {
      if (!allowInside(event.target)) event.preventDefault();
    };
    const stopTouch = (event: TouchEvent) => {
      if (!allowInside(event.target)) event.preventDefault();
    };
    const stopKeys = (event: KeyboardEvent) => {
      const focusInside = contentRef.current?.contains(
        document.activeElement ?? null,
      );
      const scrollKeys = new Set([
        " ",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        "ArrowUp",
        "ArrowDown",
      ]);
      if (!focusInside && scrollKeys.has(event.key)) event.preventDefault();
    };

    window.addEventListener("wheel", stopWheel, {
      passive: false,
      capture: true,
    });
    window.addEventListener("touchmove", stopTouch, {
      passive: false,
      capture: true,
    });
    window.addEventListener("keydown", stopKeys, true);

    return () => {
      window.removeEventListener("wheel", stopWheel, {
        capture: true,
      } as any);
      window.removeEventListener("touchmove", stopTouch, {
        capture: true,
      } as any);
      window.removeEventListener("keydown", stopKeys, true);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const container = contentRef.current;
    if (!container) return;

    const selector =
      'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !contentRef.current) return;
      const focusable = Array.from(
        contentRef.current.querySelectorAll<HTMLElement>(selector),
      ).filter(
        (node) =>
          !node.hasAttribute("disabled") &&
          node.getAttribute("aria-hidden") !== "true",
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first) {
          last.focus();
          event.preventDefault();
        }
      } else if (!active || active === last) {
        first.focus();
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    queueMicrotask(() => {
      const first = container.querySelector<HTMLElement>(selector);
      first?.focus();
    });

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPrimitive.Portal forceMount>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[98] bg-black/45 backdrop-blur-[2px] transition-opacity duration-120 data-[state=open]:opacity-100 data-[state=closed]:opacity-0" />
        <DialogPrimitive.Content forceMount asChild>
          <div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            className={cn(
              "fixed z-[99] p-0 !bottom-auto",
              "max-w-[calc(100vw-2rem)]",
              "rounded-b-2xl rounded-t-none",
              "border-[6px] border-[var(--cream)]",
              "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]",
              "bg-[var(--surface)] text-[var(--text)]",
              "opacity-0 data-[state=open]:opacity-100 transition-opacity duration-120",
              className,
            )}
            style={{
              top: topPx,
              left: leftPx,
              right: "auto",
              bottom: "auto",
              transform: "none",
              width: dialogWidth,
              maxWidth: `calc(100vw - ${DIALOG_MARGIN * 2}px)`,
            }}
          >
            <DialogPrimitive.Title asChild>
              <VisuallyHidden>Search command menu</VisuallyHidden>
            </DialogPrimitive.Title>
            <DialogPrimitive.Description asChild>
              <VisuallyHidden>
                Type to search. Use arrow keys to navigate. Press Enter to open.
                Press Escape to close.
              </VisuallyHidden>
            </DialogPrimitive.Description>
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      cmdk-input-wrapper=""
      className={cn(
        "relative z-10",
        "flex h-12 items-center gap-2 px-3",
        "rounded-md",
        "bg-[var(--surface)]",
        "ring-1 ring-[var(--brand)] focus-within:ring-2",
        "mb-2",
      )}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70">
        <path
          fill="currentColor"
          d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5l1.5-1.5l-5-5m-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14"
        />
      </svg>
      <CommandPrimitive.Input
        className={cn(
          "h-12 flex-1 bg-transparent text-sm",
          "border-0 outline-none focus:outline-none",
          "ring-0 focus:ring-0 shadow-none focus:shadow-none",
          "appearance-none",
          "text-[var(--text)] placeholder:text-[var(--muted)]",
          className,
        )}
        {...props}
      />
      <kbd className="rounded-md border border-black/10 dark:border-white/10 px-1.5 py-0.5 text-xs text-[var(--muted)]">
        ⌘K
      </kbd>
    </div>
  );
}

export function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn(
        "max-h-[60vh] overflow-auto bg-[var(--surface)] px-2 pb-2 pt-1",
        className,
      )}
      {...props}
    />
  );
}

export const CommandEmpty = (
  props: React.ComponentProps<typeof CommandPrimitive.Empty>,
) => (
  <CommandPrimitive.Empty
    {...props}
    className={cn("px-3 py-4 text-sm text-[var(--muted)]", props.className)}
  />
);

export const CommandGroup = (
  props: React.ComponentProps<typeof CommandPrimitive.Group>,
) => (
  <CommandPrimitive.Group
    {...props}
    className={cn(
      "mb-1",
      "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1",
      "[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold",
      "[&_[cmdk-group-heading]]:text-[var(--muted)]",
      props.className,
    )}
  />
);

export const CommandItem = (
  props: React.ComponentProps<typeof CommandPrimitive.Item>,
) => (
  <CommandPrimitive.Item
    {...props}
    className={cn(
      "flex h-10 items-center rounded-lg px-2 text-[var(--text)]",
      "relative transition-colors",
      "hover:bg-[var(--surface-2)] data-[selected=true]:bg-[var(--surface-2)]",
      "data-[selected=true]:ring-1 ring-[var(--brand)] ring-inset",
      props.className,
    )}
  />
);

export const CommandSeparator = (
  props: React.ComponentProps<typeof CommandPrimitive.Separator>,
) => (
  <CommandPrimitive.Separator
    {...props}
    className={cn("my-1 h-px bg-black/10 dark:bg-white/10", props.className)}
  />
);

export const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "ml-auto text-xs tracking-widest text-[var(--muted)]",
      className,
    )}
    {...props}
  />
);
CommandShortcut.displayName = "CommandShortcut";
