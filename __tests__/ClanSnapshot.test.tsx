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
          ...(trend === "flat" ? { prevRanking: 149 } : {}),
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

      const clanLink = screen.getByRole("link", {
        name: "florida state seminoles",
      });
      expect(clanLink).toHaveAttribute("data-clan-tag", "noles");
      expect(clanLink).toHaveAttribute(
        "href",
        "/cardattack/clans/florida-state-seminoles",
      );
      expect(clanLink).toHaveClass(
        "font-bold",
        "italic",
        "!text-[var(--person-tag-color,var(--blue))]",
        "!no-underline",
        "hover:!bg-[var(--person-tag-hover-bg,var(--blue))]",
        "hover:!text-[var(--person-tag-hover-color,var(--white))]",
        "hover:!no-underline",
      );
      expect(screen.getByText("basketball")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "149th" })).toHaveAttribute(
        "href",
        "/cardattack/clans/florida-state-seminoles",
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
    expect(screen.getByLabelText("New snapshot")).toHaveTextContent("🆕");
    expect(screen.getByText("(1 card)")).toBeInTheDocument();
  });

  it("renders the new snapshot emoji when a flat snapshot has no previous rank", async () => {
    getClanSnapshotsForTagOnDateMock.mockResolvedValue([
      {
        clanId: "12",
        slug: "florida-state-seminoles",
        sport: "basketball",
        displayName: "Florida State Seminoles",
        cardCount: 178,
        ranking: 149,
        rankingAt: "2026-04-10",
        trend: "flat",
      },
    ]);

    const ui = await ClanSnapshot({
      tag: "noles",
      snapshotDate: "2026-04-10",
    });
    render(ui);

    expect(screen.getByLabelText("New snapshot")).toHaveTextContent("🆕");
    expect(screen.queryByLabelText("No change")).not.toBeInTheDocument();
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

  it("falls back to a generic tag link when no dated snapshot exists", async () => {
    getClanSnapshotsForTagOnDateMock.mockResolvedValue([]);

    const ui = await ClanSnapshot({
      tag: "noles",
      snapshotDate: "2026-04-10",
    });
    render(ui);

    const clanLink = screen.getByRole("link", { name: "noles" });
    expect(clanLink).toHaveAttribute("data-clan-tag", "noles");
    expect(clanLink).toHaveAttribute("href", "/shaolin/tags/noles");
    expect(screen.queryByText("(178 cards)")).not.toBeInTheDocument();
  });

  it("uses an explicit clan href when provided", async () => {
    getClanSnapshotsForTagOnDateMock.mockResolvedValue([]);

    const ui = await ClanSnapshot({
      tag: "bucks-n-six",
      snapshotDate: "2026-07-06",
      href: "/cardattack/clans/milwaukee-bucks",
    });
    render(ui);

    expect(screen.getByRole("link", { name: "bucks-n-six" })).toHaveAttribute(
      "href",
      "/cardattack/clans/milwaukee-bucks",
    );
  });
});
