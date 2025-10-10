export type EventName =
  | "menu.desktop.open"
  | "menu.desktop.click"
  | "menu.mobile.open"
  | "menu.mobile.click"
  | "menu.cmdk.open"
  | "menu.cmdk.search"
  | "menu.cmdk.select"
  | "nav.search.submit"
  | "menu_expand";

export interface Analytics {
  track: (name: EventName, props?: Record<string, unknown>) => void;
}

type Recorder = (event: {
  name: EventName;
  props: Record<string, unknown>;
}) => void;

let recorder: Recorder | null = null;

export function setAnalyticsRecorder(next: Recorder | null): void {
  recorder = next;
}

export const analytics: Analytics = {
  track(name, props = {}) {
    const globalScope = globalThis as any;

    if (recorder) {
      try {
        recorder({ name, props });
      } catch {
        // ignore errors from injected recorders
      }
      return;
    }

    const analyticsStub = globalScope.__analytics;
    if (analyticsStub && typeof analyticsStub.record === "function") {
      try {
        analyticsStub.record({ name, props });
      } catch {
        // ignore stub errors
      }
      return;
    }

    const enabled =
      (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED ?? "").trim() === "1";

    if (enabled) {
      const posthog = globalScope.posthog ?? globalScope.POSTHOG;
      if (posthog?.capture) {
        try {
          posthog.capture(name, props);
          return;
        } catch {
          // ignore
        }
      }

      const plausible = globalScope.plausible;
      if (typeof plausible === "function") {
        try {
          plausible(name, { props });
          return;
        } catch {
          // ignore
        }
      }
    }
    // no-op fallback
  },
};
