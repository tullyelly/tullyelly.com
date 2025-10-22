"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  Close as DialogClose,
  Content as DraggableContent,
  Description as DialogDescription,
  Overlay as DialogOverlay,
  Root as DialogRoot,
  Title as DialogTitle,
} from "./dialog";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  draggable?: boolean;
  initialPosition?: {
    top?: number | string;
    left?: number | string;
  };
};

const INERT_TARGET_CANDIDATES = [
  "#page-root",
  "#content-pane",
  "#pane-body",
  "#__next",
  "main#page-main",
  "main[role='main']",
];

let bodyLockDepth = 0;
let previousBodyOverflow: string | null = null;
let previousBodyDataAttr: string | null = null;

let inertDepth = 0;
let inertTarget: HTMLElement | null = null;
let inertPreviousAriaHidden: string | null = null;

function resolveInertTarget(): HTMLElement | null {
  const doc = globalThis.document;
  if (!doc) return null;
  for (const selector of INERT_TARGET_CANDIDATES) {
    const candidate = doc.querySelector(selector);
    if (candidate instanceof HTMLElement) {
      return candidate;
    }
  }
  return null;
}

function coercePositionValue(
  value: number | string | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "number") return `${value}px`;
  return value;
}

function lockDocument(): () => void {
  const doc = globalThis.document;
  if (!doc) return () => {};

  bodyLockDepth += 1;
  if (bodyLockDepth === 1) {
    previousBodyOverflow = doc.body.style.overflow || null;
    previousBodyDataAttr = doc.body.getAttribute("data-modal-open");
    doc.body.style.overflow = "hidden";
    doc.body.setAttribute("data-modal-open", "true");
  }

  inertDepth += 1;
  if (inertDepth === 1) {
    inertTarget = resolveInertTarget();
    if (inertTarget) {
      inertPreviousAriaHidden = inertTarget.getAttribute("aria-hidden");
      inertTarget.setAttribute("aria-hidden", "true");
      inertTarget.setAttribute("inert", "");
    }
  }

  return () => {
    if (bodyLockDepth > 0) {
      bodyLockDepth -= 1;
      if (bodyLockDepth === 0) {
        if (previousBodyOverflow != null) {
          doc.body.style.overflow = previousBodyOverflow;
        } else {
          doc.body.style.removeProperty("overflow");
        }
        if (previousBodyDataAttr != null) {
          doc.body.setAttribute("data-modal-open", previousBodyDataAttr);
        } else {
          doc.body.removeAttribute("data-modal-open");
        }
        previousBodyOverflow = null;
        previousBodyDataAttr = null;
      }
    }

    if (inertDepth > 0) {
      inertDepth -= 1;
      if (inertDepth === 0 && inertTarget) {
        inertTarget.removeAttribute("inert");
        if (inertPreviousAriaHidden != null) {
          inertTarget.setAttribute("aria-hidden", inertPreviousAriaHidden);
        } else {
          inertTarget.removeAttribute("aria-hidden");
        }
        inertTarget = null;
        inertPreviousAriaHidden = null;
      }
    }
  };
}

function createContentStyle(initialPosition?: ModalProps["initialPosition"]) {
  const style: React.CSSProperties = {
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
  };
  if (initialPosition) {
    const { top, left } = initialPosition;
    const coercedTop = coercePositionValue(top);
    const coercedLeft = coercePositionValue(left);
    if (coercedTop) {
      style.top = coercedTop;
    }
    if (coercedLeft) {
      style.left = coercedLeft;
    }
  }
  return style;
}

const MODAL_CONTAINER_BASE =
  "fixed left-1/2 top-1/2 z-[1001] flex max-h-[min(88vh,900px)] [--modal-vw:40vw] w-[var(--modal-vw)] max-w-[var(--modal-vw)] flex-col overflow-hidden box-border rounded-2xl border-[6px] border-[var(--cream)] bg-white text-ink shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]";

export function Modal({
  open,
  onClose,
  children,
  title,
  className,
  draggable = true,
  initialPosition,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  const style = React.useMemo(
    () => createContentStyle(initialPosition),
    [initialPosition],
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return undefined;
    const unlock = lockDocument();
    return () => unlock();
  }, [open]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        onClose();
      }
    },
    [onClose],
  );

  if (!mounted) {
    return <DialogRoot open={open} onOpenChange={handleOpenChange} />;
  }

  return (
    <DialogRoot open={open} onOpenChange={handleOpenChange}>
      {open
        ? createPortal(
            <>
              <DialogOverlay
                className="fixed inset-0 z-[1000] bg-black/25"
                data-testid="modal-overlay"
              />
              <DraggableContent
                className={cn(MODAL_CONTAINER_BASE, className)}
                draggable={draggable}
                style={style}
              >
                {title ? (
                  <DialogTitle className="sr-only">{title}</DialogTitle>
                ) : null}
                {children}
              </DraggableContent>
            </>,
            document.body,
          )
        : null}
    </DialogRoot>
  );
}

export const ModalTitle = DialogTitle;
export const ModalDescription = DialogDescription;
export const ModalClose = DialogClose;

export default Modal;
