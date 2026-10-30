import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
jest.mock("server-only", () => ({}));
jest.mock("@/lib/analytics-archive/authorization", () => ({
  requireAnalyticsOwner: jest.fn(),
}));
jest.mock("@/lib/analytics-archive/status", () => ({
  getAnalyticsStatus: jest.fn(),
  analyticsErrorLabels: {},
}));
jest.mock("@/lib/analytics-archive/report", () => ({
  getOwnerAnalyticsReport: jest.fn(),
}));
jest.mock("@/app/mark2/admin/analytics/actions", () => ({
  analyticsAction: jest.fn(),
}));
jest.mock("@/components/layout/DataPageShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("redirect");
  }),
  notFound: jest.fn(() => {
    throw new Error("not-found");
  }),
}));
import AnalyticsControls from "@/app/mark2/admin/analytics/Controls";
import AnalyticsAdminPage from "@/app/mark2/admin/analytics/page";
import { analyticsAction } from "@/app/mark2/admin/analytics/actions";
import { requireAnalyticsOwner } from "@/lib/analytics-archive/authorization";
import { getAnalyticsStatus } from "@/lib/analytics-archive/status";
import {
  AuthzForbiddenError,
  AuthzUnauthenticatedError,
} from "@/lib/authz/types";
import { getOwnerAnalyticsReport } from "@/lib/analytics-archive/report";
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getOwnerAnalyticsReport).mockResolvedValue({
    range: { from: "2026-10-01", through: "2026-10-09" },
    maxDay: "2026-10-09",
    snapshot: null,
    error: null,
  });
});
test("disabled UI leaves read-only connection test available and prevents collection submissions", () => {
  render(
    <AnalyticsControls
      enabled={false}
      range={{ from: "2026-10-01", through: "2026-10-09" }}
      hasPendingImport={true}
    />,
  );
  expect(screen.getByRole("button", { name: "Test connection" })).toBeEnabled();
  for (const name of ["Run now", "Import history", "Continue import"])
    expect(screen.getByRole("button", { name })).toBeDisabled();
});
test("connection button posts the named server action and announces its controlled result", async () => {
  jest.mocked(analyticsAction).mockResolvedValueOnce({
    status: "success",
    message: "Read-only connection passed",
  });
  render(
    <AnalyticsControls enabled={false} range={null} hasPendingImport={false} />,
  );
  // Global setup installs undici FormData; React form submission needs the DOM version.
  const original = globalThis.FormData;
  const frame = document.createElement("iframe");
  document.body.appendChild(frame);
  globalThis.FormData = (
    frame.contentWindow as Window & typeof globalThis
  ).FormData;
  try {
    fireEvent.click(screen.getByRole("button", { name: "Test connection" }));
    await waitFor(() => expect(analyticsAction).toHaveBeenCalledTimes(1));
    expect(jest.mocked(analyticsAction).mock.calls[0][1].get("operation")).toBe(
      "test",
    );
    expect(
      await screen.findByText("success: Read-only connection passed"),
    ).toHaveAttribute("role", "status");
  } finally {
    globalThis.FormData = original;
    frame.remove();
  }
});
test.each([new AuthzUnauthenticatedError(), new AuthzForbiddenError()])(
  "page rejects unauthorized access before reading status",
  async (error) => {
    jest.mocked(requireAnalyticsOwner).mockRejectedValueOnce(error);
    await expect(AnalyticsAdminPage()).rejects.toThrow();
    expect(getAnalyticsStatus).not.toHaveBeenCalled();
    expect(getOwnerAnalyticsReport).not.toHaveBeenCalled();
  },
);
test("authorized page separates stale daily collection and backfill gaps without showing secrets", async () => {
  jest.mocked(requireAnalyticsOwner).mockResolvedValueOnce(undefined);
  jest.mocked(getAnalyticsStatus).mockResolvedValueOnce({
    enabled: false,
    range: { from: "2026-10-01", through: "2026-10-09" },
    lastAttempt: null,
    lastSuccess: null,
    lastDailySuccess: null,
    latestDay: "2026-10-09",
    dailyNext: "2026-10-10",
    stale: true,
    error: null,
    history: {
      start_day: "2026-10-01",
      end_day: "2026-10-09",
      next_day: "2026-10-03",
      total: 9,
      verified: 2,
      unavailable: 1,
      incomplete: 1,
      api_failures: 1,
      recorded: 5,
    },
  });
  render(
    await AnalyticsAdminPage({
      searchParams: Promise.resolve({
        from: "2026-10-01",
        through: "2026-10-09",
      }),
    }),
  );
  expect(getOwnerAnalyticsReport).toHaveBeenCalledWith({
    from: "2026-10-01",
    through: "2026-10-09",
  });
  expect(
    screen.getByText(/no successful daily collection in the last 36 hours/),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      /2 of 9 days verified; 1 unavailable; 1 incomplete; 1 API failures; 4 unattempted/,
    ),
  ).toBeInTheDocument();
  expect(screen.getByText(/6 days pending verification/)).toBeInTheDocument();
  expect(
    screen.getByText(/does not send an external alert/),
  ).toBeInTheDocument();
});
