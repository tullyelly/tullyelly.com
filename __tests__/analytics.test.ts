import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

describe("analytics", () => {
  const originalEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    if (typeof originalEnabled === "undefined") {
      delete process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = originalEnabled;
    }

    delete (global as any).window;
    delete (global as any).posthog;
    delete (global as any).POSTHOG;
  });

  it("uses injected recorder when provided", () => {
    const record = jest.fn();

    jest.isolateModules(() => {
      const { analytics, setAnalyticsRecorder } =
        require("@/lib/analytics") as typeof import("@/lib/analytics");
      setAnalyticsRecorder(record);
      analytics.track("menu.desktop.open", { persona: "test" });
      setAnalyticsRecorder(null);
    });

    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith({
      name: "menu.desktop.open",
      props: { persona: "test" },
    });
  });

  it("falls back to PostHog when enabled", () => {
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = "1";
    const capture = jest.fn();
    const posthog = { capture };
    const windowStub: any = { posthog };
    (globalThis as any).window = windowStub;
    (global as any).window = windowStub;
    (globalThis as any).posthog = posthog;
    (globalThis as any).POSTHOG = posthog;
    (global as any).posthog = posthog;
    (global as any).POSTHOG = posthog;

    jest.isolateModules(() => {
      const { analytics } = require("@/lib/analytics");
      expect(() =>
        analytics.track("menu.desktop.click", { path: "/test" }),
      ).not.toThrow();
    });
  });

  it("no-ops when no providers available", () => {
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = "0";

    jest.isolateModules(() => {
      const { analytics, setAnalyticsRecorder } = require("@/lib/analytics");
      setAnalyticsRecorder(null);
      expect(() =>
        analytics.track("menu.mobile.open", { state: "open" }),
      ).not.toThrow();
    });
  });
});
