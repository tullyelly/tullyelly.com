"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Prevents first-load scroll jumps by managing scroll restoration and focus side effects.
 */
export default function InitialScrollGuard() {
  const patched = useRef(false);

  useLayoutEffect(() => {
    if (patched.current) return;
    patched.current = true;

    const prevRestore = history.scrollRestoration;

    try {
      history.scrollRestoration = "manual";
    } catch {
      // ignore unsupported browsers
    }

    const origFocus: typeof HTMLElement.prototype.focus =
      HTMLElement.prototype.focus;
    let guardActive = true;
    let handlingFocus = false;

    const handleFocusIn = (event: FocusEvent) => {
      if (!guardActive || handlingFocus) return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      handlingFocus = true;
      try {
        origFocus.call(target, { preventScroll: true } as FocusOptions);
      } catch {
        try {
          origFocus.call(target);
        } catch {
          // ignore focus failures
        }
      } finally {
        handlingFocus = false;
      }
    };

    document.addEventListener("focusin", handleFocusIn, true);

    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }

    const release = () => {
      guardActive = false;
      try {
        history.scrollRestoration = prevRestore;
      } catch {
        // ignore unsupported browsers
      }
      document.removeEventListener("focusin", handleFocusIn, true);
    };

    requestAnimationFrame(release);

    return () => {
      release();
    };
  }, []);

  return null;
}
