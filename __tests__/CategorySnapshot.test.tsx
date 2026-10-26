import { render, screen } from "@testing-library/react";
const mockExact = jest.fn();
const mockIdentity = jest.fn();
jest.mock("@/lib/data/card-categories", () => ({
  getCardCategory: (...args: unknown[]) => mockIdentity(...args),
  getCategorySnapshotOnDate: (...args: unknown[]) => mockExact(...args),
}));
import CategorySnapshot from "@/components/mdx/CategorySnapshot";
beforeEach(() => {
  jest.resetAllMocks();
  mockIdentity.mockResolvedValue({ name: "Basketball" });
});
it.each([null, 0, 125, -125])(
  "shows dated count and comparison %p inline",
  async (change) => {
    mockExact.mockResolvedValue({
      card_count: 0,
      measured_on: "2026-10-01",
      count_change: change,
    });
    const { container } = render(
      <p>
        {await CategorySnapshot({
          category: "basketball",
          snapshotDate: "2026-10-01",
        })}
      </p>,
    );
    expect(mockExact).toHaveBeenCalledWith("basketball", "2026-10-01");
    expect(screen.getByRole("link", { name: "Basketball" })).toHaveAttribute(
      "href",
      "/cardattack/categories/basketball",
    );
    expect(container).toHaveTextContent("0 cards on 2026-10-01");
    expect(container).toHaveTextContent(
      change === null
        ? "No previous measurement"
        : change === 0
          ? "+0"
          : change > 0
            ? "+125"
            : "-125",
    );
    expect(container.querySelector("p > div")).toBeNull();
  },
);
it("uses a linked label only for a missing date; never substitutes latest", async () => {
  mockExact.mockResolvedValue(null);
  const { container } = render(
    await CategorySnapshot({
      category: "basketball",
      snapshotDate: "2001-01-01",
    }),
  );
  expect(container.textContent).toBe("Basketball");
});
it("keeps a linked slug fallback during outages", async () => {
  mockExact.mockRejectedValue(new Error("offline"));
  render(
    await CategorySnapshot({
      category: "non-sport",
      snapshotDate: "2001-01-01",
    }),
  );
  expect(screen.getByRole("link", { name: "non-sport" })).toHaveAttribute(
    "href",
    "/cardattack/categories/non-sport",
  );
});

it("embeds only the ranking on the Chronicle's exact snapshot date", async () => {
  mockExact.mockResolvedValue({
    card_count: 12125,
    measured_on: "2026-10-20",
    count_change: 65,
    ranking: 1400,
    rank_delta: 40,
  });
  const { container } = render(
    await CategorySnapshot({
      category: "basketball",
      snapshotDate: "2026-10-20",
    }),
  );
  expect(container).toHaveTextContent("TCDb #1,400; Up 40 places");
});
it("does not invent a rank for a count-only snapshot", async () => {
  mockExact.mockResolvedValue({
    card_count: 12125,
    measured_on: "2026-10-20",
    count_change: null,
    ranking: null,
    rank_delta: null,
  });
  const { container } = render(
    await CategorySnapshot({
      category: "basketball",
      snapshotDate: "2026-10-20",
    }),
  );
  expect(container).not.toHaveTextContent("TCDb #");
});

it("includes signed difference and separate overall/rank trends on the exact date", async () => {
  mockExact.mockResolvedValue({
    card_count: 12125,
    measured_on: "2026-10-20",
    count_change: 65,
    ranking: 1400,
    rank_delta: 0,
    trend_rank: "flat",
    difference: 0,
    diff_delta: 10,
    trend_overall: "up",
    diff_sign_changed: true,
  });
  const { container } = render(
    await CategorySnapshot({
      category: "basketball",
      snapshotDate: "2026-10-20",
    }),
  );
  expect(container).toHaveTextContent("rank trend flat");
  expect(container).toHaveTextContent(
    "difference +0; difference change +10; difference sign changed yes; overall trend up",
  );
});
