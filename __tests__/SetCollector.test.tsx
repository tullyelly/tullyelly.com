import { render, screen } from "@testing-library/react";

jest.mock("server-only", () => ({}));

const getSetCollectorSummaryRowMock = jest.fn();
const originalConsoleError = console.error;

jest.mock("@/lib/set-collector-content", () => ({
  getSetCollectorDetailHref: (id: string | number) =>
    `/cardattack/set-collector/${id}`,
  getSetCollectorSummaryRow: (...args: unknown[]) =>
    getSetCollectorSummaryRowMock(...args),
}));

import SetCollector from "@/components/mdx/SetCollector";

describe("SetCollector", () => {
  beforeEach(() => {
    getSetCollectorSummaryRowMock.mockReset();
    console.error = originalConsoleError;
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it("renders nothing when the slug is invalid", async () => {
    const ui = await SetCollector({ set: "   " });
    expect(ui).toBeNull();
    expect(getSetCollectorSummaryRowMock).not.toHaveBeenCalled();
  });

  it("renders nothing when the set cannot be found", async () => {
    getSetCollectorSummaryRowMock.mockResolvedValue(null);

    const ui = await SetCollector({ set: "1991-92-upper-deck" });
    expect(ui).toBeNull();
  });

  it("renders inline linked progress details for a tracked set", async () => {
    getSetCollectorSummaryRowMock.mockResolvedValue({
      id: 12,
      setSlug: "1991-92-upper-deck",
      setName: "1991-92 Upper Deck",
      releaseYear: 1991,
      manufacturer: "Upper Deck",
      tcdbSetUrl: "https://www.tcdb.com/ViewSet.cfm/sid/2090/1991-92-Upper-Deck",
      completedSetPhotoPath: "/images/optimus/1991-92-upper-deck/hero.webp",
      rating: 9.5,
      cardsOwned: 456,
      totalCards: 500,
      cardsMissing: 44,
      percentComplete: 91.2,
      tcdbTradeId: "960943",
      snapshotCount: 3,
      latestSnapshotDate: "2026-04-10",
    });

    const ui = await SetCollector({ set: " /1991 92 Upper Deck/ " });
    const { container } = render(
      <ul>
        <li>{ui}</li>
      </ul>,
    );

    expect(
      screen.getByRole("link", { name: "1991-92 Upper Deck" }),
    ).toHaveAttribute("href", "/cardattack/set-collector/1991-92-upper-deck");
    expect(screen.getByText("(456/500; 91.2%)")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "960943" })).not.toBeInTheDocument();
    expect(container.querySelector("li > div")).toBeNull();
    expect(container.querySelector("li > p")).toBeNull();
  });

  it("uses the provided snapshot date for chronicle-bound rendering", async () => {
    getSetCollectorSummaryRowMock.mockResolvedValue({
      id: 12,
      setSlug: "1992-courtside-draft-pix",
      setName: "1992 Courtside Draft Pix",
      releaseYear: 1992,
      manufacturer: "Courtside",
      tcdbSetUrl:
        "https://www.tcdb.com/ViewSet.cfm/sid/56520/1992-Courtside-Draft-Pix",
      totalCards: 147,
      cardsOwned: 133,
      cardsMissing: 14,
      percentComplete: 90.5,
      snapshotCount: 4,
      tcdbTradeId: "1004001",
    });

    const ui = await SetCollector({
      set: "1992-courtside-draft-pix",
      snapshotDate: "2026-04-10",
    });
    render(ui);

    expect(getSetCollectorSummaryRowMock).toHaveBeenCalledWith(
      "1992-courtside-draft-pix",
      "2026-04-10",
    );
    expect(
      screen.getByRole("link", { name: "1992 Courtside Draft Pix" }),
    ).toHaveAttribute(
      "href",
      "/cardattack/set-collector/1992-courtside-draft-pix",
    );
    expect(screen.getByText("(133/147; 90.5%)")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "1004001" })).not.toBeInTheDocument();
  });

  it("renders a lightweight fallback when no latest snapshot is available", async () => {
    getSetCollectorSummaryRowMock.mockResolvedValue({
      id: 12,
      setSlug: "1991-92-upper-deck",
      setName: "1991-92 Upper Deck",
      releaseYear: 1991,
      manufacturer: "Upper Deck",
      tcdbSetUrl: "https://www.tcdb.com/ViewSet.cfm/sid/2090/1991-92-Upper-Deck",
      completedSetPhotoPath: "/images/optimus/1991-92-upper-deck/hero.webp",
      rating: 9.5,
      totalCards: 500,
      snapshotCount: 0,
    });

    const ui = await SetCollector({ set: "1991-92-upper-deck" });
    render(ui);

    expect(
      screen.getByRole("link", { name: "1991-92 Upper Deck" }),
    ).toHaveAttribute("href", "/cardattack/set-collector/1991-92-upper-deck");
    expect(screen.queryByText(/\(.*%/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "960943" })).not.toBeInTheDocument();
  });

  it("renders nothing when the summary lookup fails", async () => {
    getSetCollectorSummaryRowMock.mockRejectedValue(new Error("db unavailable"));
    console.error = jest.fn();

    const ui = await SetCollector({ set: " /1991 92 Upper Deck/ " });

    expect(ui).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      '[set-collector] failed to render set "1991-92-upper-deck"',
      expect.any(Error),
    );
  });
});
