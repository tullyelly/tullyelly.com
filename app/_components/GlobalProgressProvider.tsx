"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { TopBar } from "./TopBar";
import { useReducedMotion } from "./useReducedMotion";
import { isSameRoute } from "@/components/nav/sameRoute";

// Tunables
const MIN_VISIBLE_MS = 250;
const MAX_IDLE_COMPLETE_MS = 900; // complete even if cached nav has no fetches
const INTENT_ROLLBACK_MS = 600; // if intent fired but no nav/fetch, cancel
const TICK_MS = 120;

type NavigationLike = {
  addEventListener?: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => void;
  removeEventListener?: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ) => void;
};

const getNavigationApi = (scope: typeof globalThis): NavigationLike | null => {
  const candidate = (scope as { navigation?: unknown }).navigation;
  if (typeof candidate !== "object" || candidate === null) return null;
  return candidate as NavigationLike;
};

const getRequestAnimationFrame = (scope: typeof globalThis) => {
  const candidate = (
    scope as { requestAnimationFrame?: typeof requestAnimationFrame }
  ).requestAnimationFrame;
  return typeof candidate === "function" ? candidate : null;
};

export default function GlobalProgressProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reducedMotion = useReducedMotion();

  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);

  const inflight = useRef(0);
  const startedAt = useRef<number | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPatched = useRef(false);
  const historyPatched = useRef(false);
  const listenersReady = useRef(false);

  const reducedMotionRef = useRef(reducedMotion);
  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  const lastKey = `${pathname}?${searchParams?.toString() ?? ""}`;

  const speculativeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentToken = useRef(0);
  const hadActivitySinceIntent = useRef(false);

  const startQueued = useRef(false);
  const scheduleStartRef = useRef<() => void>(() => {});

  const start = () => {
    if (!active) {
      startedAt.current = performance.now();
      setActive(true);
      setProgress(0.08);
      if (!tickTimer.current && !reducedMotionRef.current) {
        tickTimer.current = setInterval(() => {
          setProgress((p) => Math.min(0.9, p + 0.12 * (1 - p)));
        }, TICK_MS);
      }
    }
  };

  const complete = () => {
    const since = startedAt.current
      ? performance.now() - startedAt.current
      : MIN_VISIBLE_MS;
    const wait = Math.max(0, MIN_VISIBLE_MS - since);
    if (doneTimer.current) clearTimeout(doneTimer.current);
    doneTimer.current = setTimeout(() => {
      setProgress(1);
      setTimeout(
        () => {
          setActive(false);
          setProgress(0);
          startedAt.current = null;
          if (tickTimer.current) {
            clearInterval(tickTimer.current);
            tickTimer.current = null;
          }
        },
        reducedMotionRef.current ? 80 : 160,
      );
    }, wait);
  };

  const cancelIfNoActivity = (token: number) => {
    if (intentToken.current !== token) return;
    if (!hadActivitySinceIntent.current && inflight.current === 0) {
      // Silent rollback
      setActive(false);
      setProgress(0);
      startedAt.current = null;
      if (tickTimer.current) {
        clearInterval(tickTimer.current);
        tickTimer.current = null;
      }
    }
  };

  const scheduleStart = () => {
    if (startQueued.current) return;
    startQueued.current = true;
    const run = () => {
      startQueued.current = false;
      start(); // safe: runs outside insertion effect
    };
    const raf =
      typeof globalThis === "object"
        ? getRequestAnimationFrame(globalThis)
        : null;
    if (raf) {
      raf(() => setTimeout(run, 0));
    } else {
      setTimeout(run, 0);
    }
  };

  scheduleStartRef.current = scheduleStart;

  useEffect(() => {
    if (fetchPatched.current) return;
    if (typeof globalThis !== "object") return;

    const scope = globalThis as typeof globalThis & { fetch?: typeof fetch };
    if (typeof scope.fetch !== "function") return;

    fetchPatched.current = true;

    const originalFetch = scope.fetch.bind(scope);

    scope.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string" || input instanceof URL
          ? String(input)
          : (input as Request).url;

      const sameOrigin =
        url.startsWith("/") ||
        ("location" in scope && scope.location
          ? url.startsWith(scope.location.origin)
          : false);

      if (sameOrigin) {
        inflight.current += 1;
        hadActivitySinceIntent.current = true;
        scheduleStartRef.current();
      }
      try {
        const response = await originalFetch(input as any, init);
        return response;
      } finally {
        if (sameOrigin) {
          inflight.current = Math.max(0, inflight.current - 1);
          if (inflight.current === 0) {
            setTimeout(() => {
              if (inflight.current === 0) complete();
            }, 10);
          }
        }
      }
    }) as typeof scope.fetch;
  }, []);

  useEffect(() => {
    if (historyPatched.current) return;
    if (typeof globalThis !== "object") return;

    const scope = globalThis as typeof globalThis & { history?: History };
    const { history } = scope;
    if (!history) return;

    historyPatched.current = true;

    const patchHistoryMethod = <K extends "pushState" | "replaceState">(
      key: K,
    ) => {
      const original = history[key];
      if (typeof original !== "function") return;
      try {
        history[key] = ((...args: Parameters<History[K]>) => {
          hadActivitySinceIntent.current = true; // programmatic nav is activity
          scheduleStartRef.current(); // defer to post-commit; avoids insertion-effect update
          return (
            original as (
              ...inner: Parameters<History[K]>
            ) => ReturnType<History[K]>
          ).apply(history, args);
        }) as History[K];
      } catch {
        // Some runtimes may prevent reassignment; skip silently.
      }
    };

    patchHistoryMethod("pushState");
    patchHistoryMethod("replaceState");
  }, []);

  useEffect(() => {
    if (listenersReady.current) return;
    if (typeof globalThis !== "object") return;

    const scope = globalThis as typeof globalThis & {
      document?: Document;
      location?: Location;
      addEventListener?: typeof addEventListener;
      removeEventListener?: typeof removeEventListener;
      navigation?: unknown;
    };
    const { document: doc, location } = scope;
    if (!doc || !location || typeof doc.addEventListener !== "function") return;

    listenersReady.current = true;

    const isModifiedPointer = (event: PointerEvent | MouseEvent) =>
      ((event as MouseEvent).button !== undefined &&
        (event as MouseEvent).button !== 0) ||
      (event as MouseEvent).metaKey ||
      (event as MouseEvent).ctrlKey ||
      (event as MouseEvent).shiftKey ||
      (event as MouseEvent).altKey;

    const looksLikeInternalNav = (node: EventTarget | null): boolean => {
      const el = node as HTMLElement | null;
      if (!el?.closest) return false;

      const anchor = el.closest("a[href]") as HTMLAnchorElement | null;
      if (anchor) {
        const href = anchor.getAttribute("href") || "";
        if (
          !href ||
          href.startsWith("#") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:")
        ) {
          return false;
        }
        try {
          const url = new URL(href, location.href);
          if (url.origin !== location.origin) return false;
          if (isSameRoute(location.pathname, url.pathname)) return false;
        } catch {
          if (!href.startsWith("/")) return false;
          if (isSameRoute(location.pathname, href)) return false;
        }
        if (anchor.target && anchor.target !== "_self") return false;
        return true;
      }
      const proxy = el.closest(
        '[role="link"],button[formaction],button[data-nav],[data-nav]',
      ) as HTMLElement | null;
      return Boolean(proxy);
    };

    const beginSpeculative = () => {
      const token = ++intentToken.current;
      hadActivitySinceIntent.current = false;
      scheduleStartRef.current();
      if (speculativeTimer.current) clearTimeout(speculativeTimer.current);
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
      if (target && looksLikeInternalNav(target)) beginSpeculative();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      const activeEl = doc.activeElement as HTMLElement | null;
      if (activeEl && looksLikeInternalNav(activeEl)) beginSpeculative();
    };

    const onSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement | null;
      if (!form) return;
      const action = form.getAttribute("action") || "";
      const sameOrigin =
        !action || action.startsWith("/") || action.startsWith(location.origin);
      if (sameOrigin) beginSpeculative();
    };

    doc.addEventListener("pointerdown", onPointerDown, true);
    doc.addEventListener("keydown", onKeyDown, true);
    doc.addEventListener("submit", onSubmit, true);

    const nav = getNavigationApi(scope);
    const onNavigate = () => {
      hadActivitySinceIntent.current = true;
      scheduleStartRef.current();
    };
    nav?.addEventListener?.("navigate", onNavigate);

    const markHardNav = () => {
      hadActivitySinceIntent.current = true;
      scheduleStartRef.current();
    };

    const onVisibilityChange = () => {
      if (doc.visibilityState === "hidden") {
        markHardNav();
      }
    };

    const addWindowListener = scope.addEventListener?.bind(scope);
    const removeWindowListener = scope.removeEventListener?.bind(scope);
    addWindowListener?.("beforeunload", markHardNav);
    addWindowListener?.("pagehide", markHardNav);
    doc.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      doc.removeEventListener("pointerdown", onPointerDown, true);
      doc.removeEventListener("keydown", onKeyDown, true);
      doc.removeEventListener("submit", onSubmit, true);
      nav?.removeEventListener?.("navigate", onNavigate);
      removeWindowListener?.("beforeunload", markHardNav);
      removeWindowListener?.("pagehide", markHardNav);
      doc.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  // Kick on actual URL changes, with idle-complete for cache hits
  useEffect(() => {
    hadActivitySinceIntent.current = true;
    scheduleStartRef.current();
    const timeout = setTimeout(() => {
      if (inflight.current === 0) complete();
    }, MAX_IDLE_COMPLETE_MS);
    return () => clearTimeout(timeout);
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
