"use client";

import * as React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";

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

export const Content = React.forwardRef<HTMLDivElement, ContentProps>(
  (
    {
      children,
      draggable,
      dragHandleSelector = "[data-dialog-handle]",
      clampPadding = 16,
      style,
      ...props
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

    const endDrag = React.useCallback((e?: PointerEvent) => {
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
    }, []);

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
          // re-measure size for clamping
          const rect = node.getBoundingClientRect();
          halfSizeRef.current = {
            halfW: rect.width / 2,
            halfH: rect.height / 2,
          };
        }
      });
      observer.observe(node, {
        attributes: true,
        attributeFilter: ["hidden", "aria-hidden", "data-state"],
      });
      return () => observer.disconnect();
    }, []);

    // Reset transform whenever content node changes (e.g., open/close remount)
    React.useEffect(() => {
      const node = containerRef.current;
      if (node) {
        node.style.transform = `translate(-50%, -50%)`;
      }
      offsetRef.current = { x: 0, y: 0 };
    }, []);

    // Merge incoming styles while allowing runtime transform updates
    const initialStyle = React.useMemo<React.CSSProperties>(() => {
      const base = (style as React.CSSProperties) || {};
      // The transform will be mutated during drag; seed with any provided transform
      return { ...base, willChange: "transform" };
    }, [style]);

    return (
      <RadixDialog.Content asChild {...props}>
        <div
          ref={mergedRef}
          data-overlay-root
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
