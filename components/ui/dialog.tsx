"use client";

import * as React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";

import { cn } from "@/lib/cn";

// Global default for draggability. Can be toggled by the app if needed.
export let draggableByDefault = true;
export function setDialogDraggableByDefault(value: boolean) {
  draggableByDefault = value;
}

type ContentProps = React.ComponentProps<typeof RadixDialog.Content> & {
  draggable?: boolean;
  dragHandleSelector?: string; // default: '[data-dialog-handle]'
  clampPadding?: number; // default: 16
};

function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref && typeof ref === "object") {
        (ref as React.MutableRefObject<T | null>).current = node ?? null;
      }
    }
  };
}

function getWindow(): Window | null {
  if (typeof globalThis !== "object" || !globalThis) return null;
  return "window" in globalThis
    ? ((globalThis as typeof globalThis & { window?: Window }).window ?? null)
    : null;
}

export const Content = React.forwardRef<HTMLDivElement, ContentProps>(
  (
    {
      children,
      draggable,
      dragHandleSelector = "[data-dialog-handle]",
      clampPadding = 16,
      className,
      style,
      ...contentProps
    },
    forwardedRef,
  ) => {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const mergedRef = React.useMemo(
      () => composeRefs<HTMLDivElement>(forwardedRef, containerRef),
      [forwardedRef],
    );

    const isDraggable = draggable ?? draggableByDefault;

    const offsetRef = React.useRef({ x: 0, y: 0 });
    const startRef = React.useRef<{
      x: number;
      y: number;
      ox: number;
      oy: number;
    } | null>(null);
    const halfSizeRef = React.useRef<{ halfW: number; halfH: number }>({
      halfW: 0,
      halfH: 0,
    });
    const pointerIdRef = React.useRef<number | null>(null);

    const updateViewportWidth = React.useCallback(() => {
      const win = getWindow();
      if (!win) return;
      const container = containerRef.current;
      if (!container) return;

      const viewportWidth = Math.max(
        win.innerWidth ?? 0,
        win.visualViewport?.width ?? 0,
      );
      if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) return;

      const targetWidth = Math.min(viewportWidth * 0.8, 640);
      container.style.boxSizing = "border-box";
      container.style.width = `${Math.round(targetWidth)}px`;
      container.style.maxWidth = "";
      if (process.env.NODE_ENV !== "production") {
         
        console.debug("[dialog-width]", {
          innerWidth: win.innerWidth,
          visualWidth: win.visualViewport?.width ?? null,
          viewportWidth,
          targetWidth,
          width: container.style.width,
        });
      }

      const rect = container.getBoundingClientRect();
      halfSizeRef.current = {
        halfW: rect.width / 2,
        halfH: rect.height / 2,
      };
      let viewportHeight = win.visualViewport?.height ?? win.innerHeight ?? 0;
      if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) {
        viewportHeight = rect.height + clampPadding * 2;
      }
      const { halfW, halfH } = halfSizeRef.current;
      let { x, y } = offsetRef.current;

      const minX = -(viewportWidth / 2 - halfW - clampPadding);
      const maxX = viewportWidth / 2 - halfW - clampPadding;
      const minY = -(viewportHeight / 2 - halfH - clampPadding);
      const maxY = viewportHeight / 2 - halfH - clampPadding;

      if (x < minX) x = minX;
      if (x > maxX) x = maxX;
      if (y < minY) y = minY;
      if (y > maxY) y = maxY;

      if (x !== offsetRef.current.x || y !== offsetRef.current.y) {
        offsetRef.current = { x, y };
      }
      container.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0)`;
    }, [clampPadding, containerRef, halfSizeRef, offsetRef]);

    const onPointerDown = React.useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggable) return;
        if (e.button !== 0) return; // left button only
        const container = containerRef.current;
        if (!container) return;

        // Only start dragging when event originates from a handle inside the dialog
        const target = e.target as Element | null;
        if (!target) return;
        const handleEl = target.closest(dragHandleSelector);
        if (!handleEl || !container.contains(handleEl)) return;

        // Ignore drags starting from interactive controls inside the handle
        const interactive = target.closest(
          'button, [role="button"], a, input, textarea, select',
        );
        if (interactive && handleEl.contains(interactive)) return;

        // Measure current size for clamping
        const rect = container.getBoundingClientRect();
        halfSizeRef.current = { halfW: rect.width / 2, halfH: rect.height / 2 };

        // Start drag
        pointerIdRef.current = e.pointerId;
        try {
          container.setPointerCapture(e.pointerId);
        } catch {
          // some browsers may throw if capture is not supported; ignore
        }
        startRef.current = {
          x: e.clientX,
          y: e.clientY,
          ox: offsetRef.current.x,
          oy: offsetRef.current.y,
        };
        e.preventDefault();
      },
      [isDraggable, dragHandleSelector],
    );

    const onPointerMove = React.useCallback(
      (e: PointerEvent) => {
        if (pointerIdRef.current == null || startRef.current == null) return;
        const container = containerRef.current;
        if (!container) return;
        if (e.pointerId !== pointerIdRef.current) return;
        // Proposed new offset (relative to previous offset when drag started)
        let dx = e.clientX - startRef.current.x + startRef.current.ox;
        let dy = e.clientY - startRef.current.y + startRef.current.oy;

        // Clamp to viewport with padding
        const { innerWidth: vw, innerHeight: vh } = window;
        const { halfW, halfH } = halfSizeRef.current;
        const minX = -(vw / 2 - halfW - clampPadding);
        const maxX = vw / 2 - halfW - clampPadding;
        const minY = -(vh / 2 - halfH - clampPadding);
        const maxY = vh / 2 - halfH - clampPadding;
        if (dx < minX) dx = minX;
        if (dx > maxX) dx = maxX;
        if (dy < minY) dy = minY;
        if (dy > maxY) dy = maxY;

        offsetRef.current = { x: dx, y: dy };
        // Compose with the centering baseline to avoid drift/regressions
        container.style.transform = `translate(-50%, -50%) translate3d(${dx}px, ${dy}px, 0)`;
      },
      [clampPadding],
    );

    const endDrag = React.useCallback(
      (e?: PointerEvent) => {
        if (pointerIdRef.current == null) return;
        const container = containerRef.current;
        if (container && pointerIdRef.current != null) {
          try {
            container.releasePointerCapture(pointerIdRef.current);
          } catch {
            // ignore
          }
        }
        pointerIdRef.current = null;
        startRef.current = null;
        updateViewportWidth();
      },
      [updateViewportWidth],
    );

    React.useEffect(() => {
      // Attach global listeners while dragging
      const move = (e: PointerEvent) => onPointerMove(e);
      const up = (e: PointerEvent) => endDrag(e);
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
      return () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
    }, [onPointerMove, endDrag]);

    // Reset position on open/close toggles for forceMounted dialogs by watching attributes
    React.useEffect(() => {
      const node = containerRef.current;
      if (!node) return;
      const observer = new MutationObserver(() => {
        const isHidden =
          node.hasAttribute("hidden") ||
          node.getAttribute("aria-hidden") === "true" ||
          node.getAttribute("data-state") === "closed";
        if (!isHidden) {
          // reset position on open
          offsetRef.current = { x: 0, y: 0 };
          node.style.transform = `translate(-50%, -50%)`;
          updateViewportWidth();
        }
      });
      observer.observe(node, {
        attributes: true,
        attributeFilter: ["hidden", "aria-hidden", "data-state"],
      });
      return () => observer.disconnect();
    }, [updateViewportWidth]);

    React.useEffect(() => {
      const win = getWindow();
      if (!win) return;
      updateViewportWidth();

      const handleResize = () => {
        updateViewportWidth();
      };

      win.addEventListener("resize", handleResize);
      win.addEventListener("orientationchange", handleResize);

      const viewport = win.visualViewport;
      viewport?.addEventListener("resize", handleResize);

      return () => {
        win.removeEventListener("resize", handleResize);
        win.removeEventListener("orientationchange", handleResize);
        viewport?.removeEventListener("resize", handleResize);
      };
    }, [updateViewportWidth]);

    // Reset transform whenever content node changes (e.g., open/close remount)
    React.useEffect(() => {
      const node = containerRef.current;
      if (node) {
        node.style.transform = `translate(-50%, -50%)`;
      }
      offsetRef.current = { x: 0, y: 0 };
      updateViewportWidth();
    }, [updateViewportWidth]);

    // Merge incoming styles while allowing runtime transform updates
    const initialStyle = React.useMemo<React.CSSProperties>(() => {
      // Ensure border-box sizing while preserving any caller overrides.
      return {
        boxSizing: "border-box",
        transform: "translate(-50%, -50%)",
        ...(style as React.CSSProperties),
        willChange: "transform",
      };
    }, [style]);

    return (
      <RadixDialog.Content asChild {...contentProps}>
        <div
          ref={mergedRef}
          data-overlay-root
          className={cn(
            "fixed left-1/2 top-1/2 z-50 grid w-[min(80vw,640px)] max-w-[640px]",
            "sm:w-[min(80vw,640px)] max-h-[calc(100vh-2rem)]",
            "box-border overflow-x-hidden overflow-y-auto gap-4 border bg-background p-6 shadow-lg",
            "sm:rounded-lg",
            className,
          )}
          style={initialStyle}
          onPointerDown={onPointerDown}
        >
          {children}
        </div>
      </RadixDialog.Content>
    );
  },
);
Content.displayName = "DialogContent";

// Re-exports to keep Radix API familiar
export const Root = RadixDialog.Root;
export const Trigger = RadixDialog.Trigger;
export const Portal = RadixDialog.Portal;
export const Overlay = React.forwardRef<
  React.ElementRef<typeof RadixDialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Overlay>
>((props, ref) => (
  <RadixDialog.Overlay data-overlay-layer ref={ref} {...props} />
));
Overlay.displayName = RadixDialog.Overlay.displayName;
export const Title = RadixDialog.Title;
export const Description = RadixDialog.Description;
export const Close = RadixDialog.Close;

// Named exports mirror shadcn/ui expectations.
export const Dialog = Root;
export const DialogTrigger = Trigger;
export const DialogPortal = Portal;
export const DialogOverlay = Overlay;
export const DialogTitle = Title;
export const DialogDescription = Description;
export const DialogClose = Close;
export const DialogContent = Content;

// Namespace export for ergonomics: import * as Dialog from '@ui/dialog'
const DialogNamespace = {
  Root,
  Trigger,
  Portal,
  Overlay,
  Content,
  Title,
  Description,
  Close,
};

export default DialogNamespace;
