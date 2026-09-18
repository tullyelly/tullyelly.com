"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { useTopAnchor } from "@/components/hooks/useTopAnchor";

const DIALOG_MARGIN = 16;

export const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-2xl p-3 sm:p-4",
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
        <DialogPrimitive.Overlay
          data-overlay-layer
          className="fixed inset-x-0 bottom-0 z-[98] bg-black/35 backdrop-blur-[1px] transition-opacity duration-120 data-[state=open]:opacity-100 data-[state=closed]:opacity-0"
          style={{
            pointerEvents: open ? "auto" : "none",
            top: Math.max(topPx - 8, 0),
          }}
        />
        <DialogPrimitive.Content forceMount asChild>
          <div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            data-overlay-root
            aria-hidden={open ? undefined : "true"}
            className={cn(
              "fixed z-[99] p-0",
              "rounded-2xl border border-[color:var(--border-subtle)]",
              "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]",
              "bg-[var(--surface)] text-[var(--text)]",
              "opacity-0 data-[state=open]:opacity-100 transition-opacity duration-120",
              className,
            )}
            style={{
              boxSizing: "border-box",
              top: topPx,
              left: "50%",
              right: "auto",
              bottom: "auto",
              transform: "translateX(-50%)",
              width: `calc(100vw - ${DIALOG_MARGIN * 2}px)`,
              maxWidth: "680px",
              pointerEvents: open ? "auto" : "none",
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
        "rounded-xl border border-[color:var(--border-subtle)]",
        "bg-[var(--surface)]",
        "focus-within:border-[color:var(--blue)] focus-within:ring-2 focus-within:ring-[color:var(--blue)]/20",
        "[&>input:focus-visible]:outline-none [&>input:focus-visible]:outline-offset-0",
        "mb-3",
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
        "max-h-[55vh] overflow-auto bg-[var(--surface)] px-1 pb-1",
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
      "mb-1.5",
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
      "flex min-h-11 items-center rounded-lg px-2.5 py-1.5 text-[var(--text)]",
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
