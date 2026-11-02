import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ session: vi.fn(), must: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/auth", () => ({ authOptions: {} }));
vi.mock("next-auth/next", () => ({ getServerSession: mocks.session }));
vi.mock("@/lib/authz", () => ({ must: mocks.must }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a {...props} href={href}>
      {children}
    </a>
  ),
}));
import AnalyticsNavigation from "@/app/mark2/admin/AnalyticsNavigation";
beforeEach(() => {
  mocks.session.mockReset();
  mocks.must.mockReset().mockResolvedValue(undefined);
});
afterEach(cleanup);
describe("request-scoped Analytics navigation", () => {
  it.each([
    null,
    { user: { id: "user", role: "admin" } },
    { user: { role: "owner" } },
  ])("hides from anonymous/non-owner/missing identity: %j", async (session) => {
    mocks.session.mockResolvedValue(session);
    expect(await AnalyticsNavigation()).toBeNull();
    expect(mocks.must).not.toHaveBeenCalled();
  });
  it("hides from an owner denied strict capability and reevaluates next request", async () => {
    mocks.session.mockResolvedValue({ user: { id: "owner", role: "owner" } });
    mocks.must.mockRejectedValueOnce(new Error("stale/denied"));
    expect(await AnalyticsNavigation()).toBeNull();
    render(await AnalyticsNavigation());
    expect(
      screen.getByRole("link", { name: "Analytics administration" }),
    ).toHaveAttribute("href", "/mark2/admin/analytics");
    expect(mocks.must).toHaveBeenCalledWith(
      { id: "owner" },
      "admin.analytics.manage",
      { strict: true },
    );
    expect(mocks.session).toHaveBeenCalledTimes(2);
  });
});
