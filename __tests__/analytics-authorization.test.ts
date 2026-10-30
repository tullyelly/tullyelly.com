/** @jest-environment node */
jest.mock("server-only", () => ({}));
jest.mock("@/lib/db", () => ({ queryRows: jest.fn() }));
jest.mock("@/auth", () => ({ authOptions: {} }));
jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/authz", () => ({ must: jest.fn() }));
jest.mock("next/headers", () => ({ headers: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/analytics-archive/operations", () => ({
  runAnalyticsOperation: jest.fn(),
  testAnalyticsConnection: jest.fn(),
}));
import { getServerSession } from "next-auth/next";
import { must } from "@/lib/authz";
import { headers } from "next/headers";
import {
  requireAnalyticsOwner,
  requireAnalyticsActionOrigin,
} from "@/lib/analytics-archive/authorization";
import { analyticsAction } from "@/app/mark2/admin/analytics/actions";
import {
  runAnalyticsOperation,
  testAnalyticsConnection,
} from "@/lib/analytics-archive/operations";

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(headers).mockResolvedValue(
    new Headers({
      origin: "https://tullyelly.com",
      host: "tullyelly.com",
    }) as Awaited<ReturnType<typeof headers>>,
  );
  jest
    .mocked(getServerSession)
    .mockResolvedValue({ user: { id: "fixture-owner", role: "owner" } });
  jest.mocked(must).mockResolvedValue(undefined);
});
test("owner identity AND strict current capability are required", async () => {
  await requireAnalyticsOwner();
  expect(must).toHaveBeenCalledWith(
    { id: "fixture-owner" },
    "admin.analytics.manage",
    { strict: true },
  );
  jest
    .mocked(must)
    .mockRejectedValueOnce(new Error("Forbidden: stale or denied policy"));
  await expect(requireAnalyticsOwner()).rejects.toThrow("Forbidden");
});
test.each([
  null,
  { user: { id: "fixture-user", role: "user" } },
  { user: { role: "owner" } },
])("unauthenticated/non-owner/missing identity is denied", async (session) => {
  jest.mocked(getServerSession).mockResolvedValue(session);
  await expect(requireAnalyticsOwner()).rejects.toThrow();
  expect(must).not.toHaveBeenCalled();
});
test.each([
  { host: "tullyelly.com" },
  { origin: "null", host: "tullyelly.com" },
  { origin: "https://attacker.example", host: "tullyelly.com" },
])(
  "CSRF origin %j rejects before any data operation",
  async (requestHeaders) => {
    jest
      .mocked(headers)
      .mockResolvedValue(
        new Headers(
          Object.entries(requestHeaders).filter(
            ([, value]) => typeof value === "string",
          ) as [string, string][],
        ) as Awaited<ReturnType<typeof headers>>,
      );
    await expect(requireAnalyticsActionOrigin()).rejects.toThrow("origin");
  },
);
test.each(["test", "daily", "import", "continue"])(
  "every %s action rechecks server authorization and rejects capability denial",
  async (operation) => {
    jest.mocked(must).mockRejectedValueOnce(new Error("Forbidden"));
    const form = new FormData();
    form.set("operation", operation);
    await expect(analyticsAction(null, form)).rejects.toThrow("Forbidden");
    expect(runAnalyticsOperation).not.toHaveBeenCalled();
    expect(testAnalyticsConnection).not.toHaveBeenCalled();
  },
);
test("same-origin forwarded host works; valid test action uses read-only control", async () => {
  jest.mocked(headers).mockResolvedValue(
    new Headers({
      origin: "https://tullyelly.com",
      host: "internal.invalid",
      "x-forwarded-host": "tullyelly.com",
    }) as Awaited<ReturnType<typeof headers>>,
  );
  jest
    .mocked(testAnalyticsConnection)
    .mockResolvedValueOnce({ status: "success", message: "Read-only test" });
  const form = new FormData();
  form.set("operation", "test");
  expect((await analyticsAction(null, form)).status).toBe("success");
  expect(runAnalyticsOperation).not.toHaveBeenCalled();
});

// Exercise the real private-report authorization boundary, not just a hidden UI.
import { getOwnerAnalyticsReport } from "@/lib/analytics-archive/report";
import { queryRows } from "@/lib/db";
test.each([null, { user: { id: "fixture-user", role: "admin" } }])(
  "private report rejects anonymous/non-owner before SQL",
  async (session) => {
    jest.mocked(getServerSession).mockResolvedValue(session);
    await expect(getOwnerAnalyticsReport()).rejects.toThrow();
    expect(queryRows).not.toHaveBeenCalled();
  },
);
test("private report rejects an owner with stale/denied capability before SQL", async () => {
  jest.mocked(must).mockRejectedValueOnce(new Error("stale capability"));
  await expect(getOwnerAnalyticsReport()).rejects.toThrow("stale capability");
  expect(queryRows).not.toHaveBeenCalled();
});
