import { render, screen } from "@testing-library/react";

const getTcdbSnapshotForTagOnDateMock = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("@/lib/data/tcdb-snapshot", () => ({
  getTcdbSnapshotForTagOnDate: (...args: unknown[]) =>
    getTcdbSnapshotForTagOnDateMock(...args),
}));

import TcdbSnapshot from "@/components/mdx/TcdbSnapshot";

describe("TcdbSnapshot", () => {
  beforeEach(() => {
    getTcdbSnapshotForTagOnDateMock.mockReset();
  });

  it.each([
    { trend: "up", emoji: "↗️", label: "Trending up" },
    { trend: "down", emoji: "↘️", label: "Trending down" },
    { trend: "flat", emoji: "↔️", label: "No change" },
  ] as const)(
    "renders the correct inline snapshot markup for $trend trends",
    async ({ trend, emoji, label }) => {
      getTcdbSnapshotForTagOnDateMock.mockResolvedValue({
        homieId: "432",
        displayName: "Shaquille O'Neal",
        cardCount: 178,
        ranking: 149,
        rankingAt: "2026-04-10",
        trend,
      });

      const ui = await TcdbSnapshot({
        tag: "shaq",
        snapshotDate: "2026-04-10",
      });
      const { container } = render(
        <ul>
          <li>{ui}</li>
        </ul>,
      );

      expect(screen.getByText("shaquille o'neal")).toHaveAttribute(
        "data-person-tag",
        "shaq",
      );
      expect(screen.getByRole("link", { name: "149th" })).toHaveAttribute(
        "href",
        "/cardattack/tcdb-rankings/432",
      );
      expect(screen.getByText("[")).toBeInTheDocument();
      expect(screen.getByText("]")).toBeInTheDocument();
      expect(screen.getByLabelText(label)).toHaveTextContent(emoji);
      expect(screen.getByText("(178 cards)")).toBeInTheDocument();
      expect(screen.getByText("149th").closest("a")).toHaveTextContent("149th");
      expect(container.querySelector("li > div")).toBeNull();
      expect(container.querySelector("li > p")).toBeNull();
    },
  );

  it("falls back to a plain PersonTag when no dated snapshot exists", async () => {
    getTcdbSnapshotForTagOnDateMock.mockResolvedValue(null);

    const ui = await TcdbSnapshot({
      tag: "shaq",
      snapshotDate: "2026-04-10",
    });
    render(ui);

    expect(screen.getByText("shaq")).toHaveAttribute("data-person-tag", "shaq");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("(178 cards)")).not.toBeInTheDocument();
  });
});
