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

    (
      HTMLElement.prototype as typeof HTMLElement.prototype & {
        focus: typeof origFocus;
      }
    ).focus = function focusPatched(this: HTMLElement, ...args) {
      if (guardActive) {
        try {
          return origFocus.call(this, { preventScroll: true } as any);
        } catch {
          return origFocus.apply(this, args);
        }
      }
      return origFocus.apply(this, args);
    };

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
      HTMLElement.prototype.focus = origFocus;
    };

    requestAnimationFrame(release);

    return () => {
      release();
    };
  }, []);

  return null;
}
