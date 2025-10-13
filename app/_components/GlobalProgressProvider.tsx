"use client";

import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { TopBar } from "./TopBar";
import { useReducedMotion } from "./useReducedMotion";

type TimeoutHandle = ReturnType<typeof setTimeout>;
type IntervalHandle = ReturnType<typeof setInterval>;

const MIN_VISIBLE_MS = 250;
const MAX_IDLE_COMPLETE_MS = 900;
const INTENT_ROLLBACK_MS = 600;
const TICK_MS = 120;
const TRACKED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

const clearTimeoutRef = (ref: MutableRefObject<TimeoutHandle | null>) => {
  if (ref.current) {
    clearTimeout(ref.current);
    ref.current = null;
  }
};

const clearIntervalRef = (ref: MutableRefObject<IntervalHandle | null>) => {
  if (ref.current) {
    clearInterval(ref.current);
    ref.current = null;
  }
};

export default function GlobalProgressProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reducedMotion = useReducedMotion();

  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);

  const inflight = useRef(0);
  const startedAt = useRef<number | null>(null);

  const doneTimer = useRef<TimeoutHandle | null>(null);
  const tickTimer = useRef<IntervalHandle | null>(null);
  const settleTimer = useRef<TimeoutHandle | null>(null);
  const speculativeTimer = useRef<TimeoutHandle | null>(null);

  const fetchPatched = useRef(false);
  const historyPatched = useRef(false);
  const listenersReady = useRef(false);

  const intentToken = useRef(0);
  const hadActivitySinceIntent = useRef(false);
  const activeRef = useRef(false);
  const reducedMotionRef = useRef(reducedMotion);

  const startRef = useRef<() => void>(() => {});
  const completeRef = useRef<() => void>(() => {});

  const lastKey = `${pathname}?${searchParams?.toString() ?? ""}`;

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  const start = () => {
    if (activeRef.current) return;

    activeRef.current = true;
    clearTimeoutRef(doneTimer);
    clearTimeoutRef(settleTimer);
    clearTimeoutRef(speculativeTimer);

    startedAt.current = performance.now();
    setActive(true);
    setProgress(0.08);

    if (!tickTimer.current && !reducedMotionRef.current) {
      tickTimer.current = setInterval(() => {
        setProgress((value) => Math.min(0.9, value + 0.12 * (1 - value)));
      }, TICK_MS);
    }
  };

  const complete = () => {
    const elapsed = startedAt.current
      ? performance.now() - startedAt.current
      : MIN_VISIBLE_MS;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);

    clearTimeoutRef(doneTimer);
    doneTimer.current = setTimeout(() => {
      setProgress(1);
      clearIntervalRef(tickTimer);
      clearTimeoutRef(settleTimer);

      const finishDelay = reducedMotionRef.current ? 80 : 160;
      settleTimer.current = setTimeout(() => {
        activeRef.current = false;
        setActive(false);
        setProgress(0);
        startedAt.current = null;
      }, finishDelay);
    }, wait);
  };

  startRef.current = start;
  completeRef.current = complete;

  const cancelIfNoActivity = (token: number) => {
    if (intentToken.current !== token) return;
    if (!hadActivitySinceIntent.current && inflight.current === 0) {
      clearIntervalRef(tickTimer);
      clearTimeoutRef(doneTimer);
      clearTimeoutRef(settleTimer);
      clearTimeoutRef(speculativeTimer);
      activeRef.current = false;
      setActive(false);
      setProgress(0);
      startedAt.current = null;
    }
  };

  useEffect(
    () => () => {
      clearIntervalRef(tickTimer);
      clearTimeoutRef(doneTimer);
      clearTimeoutRef(settleTimer);
      clearTimeoutRef(speculativeTimer);
    },
    [],
  );

  useEffect(() => {
    if (fetchPatched.current) return;
    if (typeof window.fetch !== "function") return;

    fetchPatched.current = true;
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string" || input instanceof URL
          ? String(input)
          : (input as Request).url;
      const method = (
        init?.method ??
        (typeof input === "object" && input !== null && "method" in input
          ? (input as Request).method
          : "GET")
      ).toUpperCase();

      const sameOrigin = url.startsWith("/") || url.startsWith(location.origin);
      const trackable = sameOrigin && TRACKED_METHODS.has(method);

      if (trackable) {
        inflight.current += 1;
        hadActivitySinceIntent.current = true;
        clearTimeoutRef(speculativeTimer);
        startRef.current();
      }

      try {
        const response = await originalFetch(input, init);
        return response;
      } finally {
        if (trackable) {
          inflight.current = Math.max(0, inflight.current - 1);
          if (inflight.current === 0) {
            setTimeout(() => {
              if (inflight.current === 0) {
                completeRef.current();
              }
            }, 10);
          }
        }
      }
    };
  }, []);

  useEffect(() => {
    if (historyPatched.current) return;
    historyPatched.current = true;

    const patchHistoryMethod = <K extends "pushState" | "replaceState">(
      key: K,
    ) => {
      const original = history[key];
      if (typeof original !== "function") return;
      try {
        history[key] = ((...args: Parameters<typeof original>) => {
          hadActivitySinceIntent.current = true;
          clearTimeoutRef(speculativeTimer);
          startRef.current();
          return (original as (...a: unknown[]) => unknown).apply(
            history,
            args,
          );
        }) as History[K];
      } catch {
        // engines may refuse reassignment (e.g., strict Safari); ignore.
      }
    };

    patchHistoryMethod("pushState");
    patchHistoryMethod("replaceState");
  }, []);

  useEffect(() => {
    if (listenersReady.current) return;
    listenersReady.current = true;

    const isModifiedPointer = (event: PointerEvent | MouseEvent) =>
      ((event as MouseEvent).button ?? 0) !== 0 ||
      (event as MouseEvent).metaKey ||
      (event as MouseEvent).ctrlKey ||
      (event as MouseEvent).shiftKey ||
      (event as MouseEvent).altKey ||
      event.defaultPrevented;

    const looksLikeInternalNav = (target: EventTarget | null): boolean => {
      const el = target as HTMLElement | null;
      if (!el?.closest) return false;

      const anchor = el.closest("a[href]") as HTMLAnchorElement | null;
      if (anchor) {
        const href = anchor.getAttribute("href") || "";
        if (!href || href.startsWith("#")) return false;
        if (anchor.hasAttribute("download")) return false;
        if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;
        if (anchor.target && anchor.target !== "_self") return false;
        try {
          const url = new URL(href, window.location.href);
          if (url.origin !== window.location.origin) return false;
        } catch {
          if (!href.startsWith("/")) return false;
        }
        return true;
      }

      const proxy = el.closest(
        '[role="link"],button[formaction],button[data-nav],[data-nav]',
      );
      return Boolean(proxy);
    };

    const beginSpeculative = () => {
      const token = ++intentToken.current;
      hadActivitySinceIntent.current = false;
      clearTimeoutRef(settleTimer);
      clearTimeoutRef(speculativeTimer);
      startRef.current();
      speculativeTimer.current = setTimeout(
        () => cancelIfNoActivity(token),
        INTENT_ROLLBACK_MS,
      );
    };

    const onPointerDown = (event: PointerEvent) => {
      if (isModifiedPointer(event)) return;
      const target = (
        typeof event.composedPath === "function" && event.composedPath().length
          ? event.composedPath()[0]
          : event.target
      ) as EventTarget | null;
      if (target && looksLikeInternalNav(target)) {
        beginSpeculative();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && looksLikeInternalNav(activeEl)) {
        beginSpeculative();
      }
    };

    const onSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement | null;
      if (!form) return;
      const action = form.getAttribute("action") || "";
      const sameOrigin =
        !action ||
        action.startsWith("/") ||
        action.startsWith(window.location.origin);
      if (sameOrigin) {
        beginSpeculative();
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("submit", onSubmit, true);

    const navigationApi = (window as { navigation?: any }).navigation;
    const onNavigate = () => {
      hadActivitySinceIntent.current = true;
      clearTimeoutRef(speculativeTimer);
      startRef.current();
    };
    navigationApi?.addEventListener?.("navigate", onNavigate);

    const markHardNav = () => {
      hadActivitySinceIntent.current = true;
      clearTimeoutRef(speculativeTimer);
      startRef.current();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        markHardNav();
      }
    };

    window.addEventListener("beforeunload", markHardNav);
    window.addEventListener("pagehide", markHardNav);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("submit", onSubmit, true);
      navigationApi?.removeEventListener?.("navigate", onNavigate);
      window.removeEventListener("beforeunload", markHardNav);
      window.removeEventListener("pagehide", markHardNav);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    hadActivitySinceIntent.current = true;
    clearTimeoutRef(speculativeTimer);
    startRef.current();

    const idle = setTimeout(() => {
      if (inflight.current === 0) {
        completeRef.current();
      }
    }, MAX_IDLE_COMPLETE_MS);

    return () => clearTimeout(idle);
  }, [lastKey]);

  return (
    <TopBar
      active={active}
      progress={progress}
      reducedMotion={reducedMotion}
      color="#00471B"
      glow="#F0EBD2"
      height={3}
      zIndex={9999}
    />
  );
}
