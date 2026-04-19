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

  it("renders nothing when the id is invalid", async () => {
    const ui = await SetCollector({ id: "abc" });
    expect(ui).toBeNull();
    expect(getSetCollectorSummaryRowMock).not.toHaveBeenCalled();
  });

  it("renders nothing when the set cannot be found", async () => {
    getSetCollectorSummaryRowMock.mockResolvedValue(null);

    const ui = await SetCollector({ id: 12 });
    expect(ui).toBeNull();
  });

  it("renders inline linked progress details for a tracked set", async () => {
    getSetCollectorSummaryRowMock.mockResolvedValue({
      id: 12,
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

    const ui = await SetCollector({ id: "12" });
    const { container } = render(
      <ul>
        <li>{ui}</li>
      </ul>,
    );

    expect(
      screen.getByRole("link", { name: "1991-92 Upper Deck" }),
    ).toHaveAttribute("href", "/cardattack/set-collector/12");
    expect(screen.getByText("(456/500; 91.2%)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "960943" })).toHaveAttribute(
      "href",
      "/cardattack/tcdb-trades/960943",
    );
    expect(container.querySelector("li > div")).toBeNull();
    expect(container.querySelector("li > p")).toBeNull();
  });

  it("renders a lightweight fallback when no latest snapshot is available", async () => {
    getSetCollectorSummaryRowMock.mockResolvedValue({
      id: 12,
      setName: "1991-92 Upper Deck",
      releaseYear: 1991,
      manufacturer: "Upper Deck",
      tcdbSetUrl: "https://www.tcdb.com/ViewSet.cfm/sid/2090/1991-92-Upper-Deck",
      completedSetPhotoPath: "/images/optimus/1991-92-upper-deck/hero.webp",
      rating: 9.5,
      totalCards: 500,
      snapshotCount: 0,
    });

    const ui = await SetCollector({ id: 12 });
    render(ui);

    expect(
      screen.getByRole("link", { name: "1991-92 Upper Deck" }),
    ).toHaveAttribute("href", "/cardattack/set-collector/12");
    expect(screen.queryByText(/\(.*%/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "960943" })).not.toBeInTheDocument();
  });

  it("renders nothing when the summary lookup fails", async () => {
    getSetCollectorSummaryRowMock.mockRejectedValue(new Error("db unavailable"));
    console.error = jest.fn();

    const ui = await SetCollector({ id: 12 });

    expect(ui).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      '[set-collector] failed to render set "12"',
      expect.any(Error),
    );
  });
});
