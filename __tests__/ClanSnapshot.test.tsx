import { render, screen } from "@testing-library/react";

const getClanSnapshotsForTagOnDateMock = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("@/lib/data/tcdb-clan-snapshot", () => ({
  getClanSnapshotsForTagOnDate: (...args: unknown[]) =>
    getClanSnapshotsForTagOnDateMock(...args),
}));

import ClanSnapshot from "@/components/mdx/ClanSnapshot";

describe("ClanSnapshot", () => {
  beforeEach(() => {
    getClanSnapshotsForTagOnDateMock.mockReset();
  });

  it.each([
    { trend: "up", emoji: "↗️", label: "Trending up" },
    { trend: "down", emoji: "↘️", label: "Trending down" },
    { trend: "flat", emoji: "↔️", label: "No change" },
  ] as const)(
    "renders the correct inline snapshot markup for $trend trends",
    async ({ trend, emoji, label }) => {
      getClanSnapshotsForTagOnDateMock.mockResolvedValue([
        {
          clanId: "12",
          slug: "florida-state-seminoles",
          sport: "basketball",
          displayName: "Florida State Seminoles",
          cardCount: 178,
          ranking: 149,
          rankingAt: "2026-04-10",
          trend,
        },
      ]);

      const ui = await ClanSnapshot({
        tag: "noles",
        snapshotDate: "2026-04-10",
      });
      const { container } = render(
        <ul>
          <li>{ui}</li>
        </ul>,
      );

      expect(screen.getByText("florida state seminoles")).toHaveAttribute(
        "data-clan-tag",
        "noles",
      );
      expect(screen.getByText("basketball")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "149th" })).toHaveAttribute(
        "href",
        "/cardattack/tcdb-rankings/clans/florida-state-seminoles",
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

  it("renders multiple sport snapshots for a clan tag", async () => {
    getClanSnapshotsForTagOnDateMock.mockResolvedValue([
      {
        clanId: "12",
        slug: "florida-state-seminoles",
        sport: "basketball",
        displayName: "Florida State Seminoles",
        cardCount: 178,
        ranking: 149,
        rankingAt: "2026-04-10",
        trend: "up",
      },
      {
        clanId: "12",
        slug: "florida-state-seminoles",
        sport: "football",
        displayName: "Florida State Seminoles",
        cardCount: 1,
        ranking: 1,
        rankingAt: "2026-04-10",
        trend: "flat",
      },
    ]);

    const ui = await ClanSnapshot({
      tag: "noles",
      snapshotDate: "2026-04-10",
    });
    render(ui);

    expect(screen.getByText("basketball")).toBeInTheDocument();
    expect(screen.getByText("football")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "149th" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1st" })).toBeInTheDocument();
    expect(screen.getByText("(1 card)")).toBeInTheDocument();
  });

  it("passes the optional sport filter through to the data helper", async () => {
    getClanSnapshotsForTagOnDateMock.mockResolvedValue([]);

    await ClanSnapshot({
      tag: "noles",
      snapshotDate: "2026-04-10",
      sport: "football",
    });

    expect(getClanSnapshotsForTagOnDateMock).toHaveBeenCalledWith(
      "noles",
      "2026-04-10",
      "football",
    );
  });

  it("falls back to a plain clan tag when no dated snapshot exists", async () => {
    getClanSnapshotsForTagOnDateMock.mockResolvedValue([]);

    const ui = await ClanSnapshot({
      tag: "noles",
      snapshotDate: "2026-04-10",
    });
    render(ui);

    expect(screen.getByText("noles")).toHaveAttribute("data-clan-tag", "noles");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("(178 cards)")).not.toBeInTheDocument();
  });
});
