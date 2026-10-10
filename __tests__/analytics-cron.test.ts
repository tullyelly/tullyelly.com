/** @jest-environment node */
jest.mock("@/lib/analytics-archive/operations", () => ({
  runAnalyticsOperation: jest.fn(),
}));
import {
  GET,
  dynamic,
  runtime,
  maxDuration,
} from "@/app/api/cron/analytics/route";
import { runAnalyticsOperation } from "@/lib/analytics-archive/operations";
import proxy from "@/proxy";
import { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
beforeEach(() => {
  jest.clearAllMocks();
  process.env.CRON_SECRET = "fixture-cron-secret";
});
test.each([null, "Bearer incorrect", "fixture-cron-secret", "Bearer "])(
  "rejects bad bearer %s before service invocation, without cache or redirect",
  async (credential) => {
    const response = await GET(
      new Request("https://tullyelly.com/api/cron/analytics", {
        headers: credential ? { authorization: credential } : {},
      }),
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("vercel-cdn-cache-control")).toBe("no-store");
    expect(response.headers.get("location")).toBeNull();
    expect(runAnalyticsOperation).not.toHaveBeenCalled();
  },
);
test("missing server secret denies even a supplied bearer", async () => {
  delete process.env.CRON_SECRET;
  expect(
    (
      await GET(
        new Request("https://tullyelly.com/api/cron/analytics", {
          headers: { authorization: "Bearer fixture-cron-secret" },
        }),
      )
    ).status,
  ).toBe(401);
  expect(runAnalyticsOperation).not.toHaveBeenCalled();
});
test.each([
  ["disabled", 200],
  ["success", 200],
  ["partial", 202],
  ["failure", 500],
] as const)(
  "authenticated %s returns explicit uncached HTTP %d",
  async (status, code) => {
    jest
      .mocked(runAnalyticsOperation)
      .mockResolvedValueOnce({ status, message: "Fixture result" });
    const response = await GET(
      new Request("https://tullyelly.com/api/cron/analytics", {
        headers: { authorization: "Bearer fixture-cron-secret" },
      }),
    );
    expect(response.status).toBe(code);
    expect((await response.json()).status).toBe(status);
    expect(response.headers.get("cdn-cache-control")).toBe("no-store");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(runAnalyticsOperation).toHaveBeenCalledWith({ kind: "daily" });
  },
);
test("cron bypasses proxy sign-in handling and has exactly one UTC schedule", () => {
  const response = proxy(
    new NextRequest("https://tullyelly.com/api/cron/analytics"),
  );
  expect(response.headers.get("x-middleware-next")).toBe("1");
  expect(response.headers.get("location")).toBeNull();
  const config = JSON.parse(readFileSync("vercel.json", "utf8"));
  expect(
    config.crons.filter(
      (entry: { path: string }) => entry.path === "/api/cron/analytics",
    ),
  ).toEqual([{ path: "/api/cron/analytics", schedule: "17 9 * * *" }]);
  expect(dynamic).toBe("force-dynamic");
  expect(runtime).toBe("nodejs");
  expect(maxDuration).toBe(60);
});
