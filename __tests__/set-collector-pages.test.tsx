import { render, screen } from "@testing-library/react";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const React = require("react");
    return React.createElement("img", props);
  },
}));

jest.mock("@/lib/datetime", () => ({
  fmtDate: (value: string) => value,
}));

import SetCollectorDetailPage from "@/components/set-collector/SetCollectorDetailPage";
import SetCollectorLandingPage from "@/components/set-collector/SetCollectorLandingPage";

describe("set collector pages", () => {
  it("renders the set collector landing page with top-line stats and row links", () => {
    render(
      <SetCollectorLandingPage
        rows={[
          {
            id: 12,
            setSlug: "1991-92-upper-deck",
            setName: "1991-92 Upper Deck",
            releaseYear: 1991,
            manufacturer: "Upper Deck",
            tcdbSetUrl:
              "https://www.tcdb.com/ViewSet.cfm/sid/2090/1991-92-Upper-Deck",
            completedSetPhotoPath:
              "/images/optimus/1991-92-upper-deck/hero.webp",
            categoryTag: "basketball",
            rating: 9.5,
            cardsOwned: 456,
            totalCards: 500,
            cardsMissing: 44,
            percentComplete: 91.2,
            tcdbTradeId: "960943",
            firstSnapshotDate: "2026-03-01",
            latestSnapshotDate: "2026-04-10",
            snapshotCount: 3,
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Set Collector" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Tracked Sets").length).toBeGreaterThan(0);
    expect(screen.getByText("Snapshots")).toBeInTheDocument();
    expect(screen.getAllByText("1991-92 Upper Deck").length).toBeGreaterThan(0);
    expect(screen.getAllByText("9.5/10").length).toBeGreaterThan(0);
    expect(screen.getAllByText("456 / 500").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "1991-92 Upper Deck" })[0],
    ).toHaveAttribute("href", "/cardattack/set-collector/1991-92-upper-deck");
  });

  it("renders the set collector detail page with current progress and snapshot history", () => {
    render(
      <SetCollectorDetailPage
        setCollector={{
          id: 12,
          setSlug: "1991-92-upper-deck",
          setName: "1991-92 Upper Deck",
          releaseYear: 1991,
          manufacturer: "Upper Deck",
          tcdbSetUrl:
            "https://www.tcdb.com/ViewSet.cfm/sid/2090/1991-92-Upper-Deck",
          completedSetPhotoPath:
            "/images/optimus/1991-92-upper-deck/hero.webp",
          categoryTag: "basketball",
          rating: 9.5,
          cardsOwned: 456,
          totalCards: 500,
          cardsMissing: 44,
          percentComplete: 91.2,
          tcdbTradeId: "960943",
          firstSnapshotDate: "2026-03-01",
          latestSnapshotDate: "2026-04-10",
          snapshotCount: 3,
          latestSnapshot: {
            id: 102,
            setId: 12,
            snapshotDate: "2026-04-10",
            cardsOwned: 456,
            totalCards: 500,
            cardsMissing: 44,
            percentComplete: 91.2,
            tcdbTradeId: "960943",
          },
          snapshots: [
            {
              id: 101,
              setId: 12,
              snapshotDate: "2026-04-01",
              cardsOwned: 450,
              totalCards: 500,
              cardsMissing: 50,
              percentComplete: 90,
            },
            {
              id: 102,
              setId: 12,
              snapshotDate: "2026-04-10",
              cardsOwned: 456,
              totalCards: 500,
              cardsMissing: 44,
              percentComplete: 91.2,
              tcdbTradeId: "960943",
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("link", { name: "← Back to Set Collector" }),
    ).toHaveAttribute("href", "/cardattack/set-collector");
    expect(
      screen.getAllByText("1991-92 Upper Deck").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("9.5/10").length).toBeGreaterThan(0);
    expect(screen.getByRole("img")).toHaveAttribute(
      "alt",
      "1991-92 Upper Deck completed set photo",
    );
    expect(screen.getByRole("link", { name: "Open Set" })).toHaveAttribute(
      "href",
      "https://www.tcdb.com/ViewSet.cfm/sid/2090/1991-92-Upper-Deck",
    );
    expect(screen.getByText("Snapshot History")).toBeInTheDocument();
    expect(screen.getAllByText("2026-04-10").length).toBeGreaterThan(0);
    expect(screen.getAllByText("456 / 500").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "960943" })[0]).toHaveAttribute(
      "href",
      "/cardattack/tcdb-trades/960943",
    );
  });

  it("renders neutral fallbacks for unrated sets without a completed photo", () => {
    render(
      <SetCollectorDetailPage
        setCollector={{
          id: 21,
          setSlug: "1993-topps-finest",
          setName: "1993 Topps Finest",
          releaseYear: 1993,
          manufacturer: "Topps",
          tcdbSetUrl:
            "https://www.tcdb.com/ViewSet.cfm/sid/9999/1993-Topps-Finest",
          categoryTag: "baseball",
          totalCards: 199,
          cardsOwned: 120,
          cardsMissing: 79,
          percentComplete: 60.3,
          firstSnapshotDate: "2026-04-01",
          latestSnapshotDate: "2026-04-14",
          snapshotCount: 2,
          latestSnapshot: {
            id: 301,
            setId: 21,
            snapshotDate: "2026-04-14",
            cardsOwned: 120,
            totalCards: 199,
            cardsMissing: 79,
            percentComplete: 60.3,
          },
          snapshots: [
            {
              id: 301,
              setId: 21,
              snapshotDate: "2026-04-14",
              cardsOwned: 120,
              totalCards: 199,
              cardsMissing: 79,
              percentComplete: 60.3,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Not rated")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Completed Set Photo" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
