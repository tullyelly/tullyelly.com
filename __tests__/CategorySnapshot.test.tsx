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

it.each([
  { trend: null, label: "New snapshot", emoji: "🆕" },
  { trend: "up", label: "Trending up", emoji: "↗️" },
  { trend: "down", label: "Trending down", emoji: "↘️" },
  { trend: "flat", label: "No change", emoji: "↔️" },
])(
  "renders the compact category summary for $trend",
  async ({ trend, label, emoji }) => {
    mockIdentity.mockResolvedValue({ name: "Football" });
    mockExact.mockResolvedValue({
      card_count: 12199,
      ranking: 6969,
      trend_overall: trend,
      difference: -1,
      measured_on: "2026-11-26",
    });
    const { container } = render(
      <p>
        {await CategorySnapshot({
          category: "football",
          snapshotDate: "2026-11-26",
        })}
      </p>,
    );
    expect(screen.getByRole("link", { name: "Football" })).toHaveAttribute(
      "href",
      "/cardattack/categories/football",
    );
    expect(container).toHaveTextContent(
      `Football [6969th] ${emoji} (12,199 cards)`,
    );
    expect(screen.getByRole("img", { name: label })).toHaveTextContent(emoji);
    expect(container).not.toHaveTextContent(
      /difference|2026-11-26|Comparison unavailable/,
    );
    expect(mockExact).toHaveBeenCalledWith("football", "2026-11-26");
    expect(container.querySelector("p > div")).toBeNull();
  },
);
it.each([0, 1])(
  "keeps count-only snapshots compact with %p cards",
  async (count) => {
    mockExact.mockResolvedValue({
      card_count: count,
      ranking: null,
      trend_overall: null,
    });
    const { container } = render(
      await CategorySnapshot({
        category: "basketball",
        snapshotDate: "2026-11-26",
      }),
    );
    expect(container).toHaveTextContent(
      `Basketball 🆕 (${count} ${count === 1 ? "card" : "cards"})`,
    );
    expect(container).not.toHaveTextContent("[");
  },
);
