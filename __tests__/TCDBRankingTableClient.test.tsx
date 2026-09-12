import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  usePathname: () => "/cardattack/clans",
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

import TCDBRankingTableClient from "@/components/tcdb/TCDBRankingTableClient";
import type { TCDBRankingTableData } from "@/components/tcdb/TCDBRankingTable";

const labels = {
  searchPlaceholder: "Search clans",
  searchAriaLabel: "Search clans",
  identifierColumn: "Sport",
  emptyMessage: "No clan rankings match your filters.",
  tableAriaLabel: "TCDB clan rankings table",
};

const serverData: TCDBRankingTableData = {
  data: [],
  meta: {
    page: 3,
    pageSize: 20,
    total: 100,
    totalPages: 5,
    q: "bucks",
    trend: "up",
  },
};

const serverDataWithClan: TCDBRankingTableData = {
  data: [
    {
      key: "clan-milwaukee-bucks-basketball",
      name: "Milwaukee Bucks",
      href: "/cardattack/clans/milwaukee-bucks",
      identifierLabel: "Sport",
      identifierValue: "Basketball",
      card_count: 12482,
      ranking: 1,
      ranking_at: "2026-09-01",
      difference: 5,
      rank_delta: 2,
      diff_delta: 3,
      trend_rank: "up",
      trend_overall: "up",
      diff_sign_changed: false,
    },
  ],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    totalPages: 1,
  },
};

const sportOptions = [
  { value: "basketball", label: "Basketball" },
  { value: "football", label: "Football" },
];

describe("TCDBRankingTableClient clan filters", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockSearchParams = new URLSearchParams(
      "q=bucks&sport=football&trend=up&page=3&pageSize=20",
    );
  });

  it("changes sport while preserving search, trend, and page size and resetting page", async () => {
    render(
      <TCDBRankingTableClient
        serverData={serverData}
        labels={labels}
        sportOptions={sportOptions}
      />,
    );

    const sport = screen.getByRole("combobox", { name: "Filter by sport" });
    expect(sport).toHaveValue("football");

    fireEvent.change(sport, { target: { value: "basketball" } });

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        "/cardattack/clans?q=bucks&sport=basketball&trend=up&pageSize=20",
      ),
    );
  });

  it("keeps every active filter when changing pages", async () => {
    render(
      <TCDBRankingTableClient
        serverData={serverData}
        labels={labels}
        sportOptions={sportOptions}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        "/cardattack/clans?q=bucks&sport=football&trend=up&page=4&pageSize=20",
      ),
    );
  });

  it("resets page on trend changes without dropping search or sport", async () => {
    render(
      <TCDBRankingTableClient
        serverData={serverData}
        labels={labels}
        sportOptions={sportOptions}
      />,
    );

    fireEvent.change(
      screen.getByRole("combobox", { name: "Filter by trend" }),
      { target: { value: "down" } },
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        "/cardattack/clans?q=bucks&sport=football&trend=down&pageSize=20",
      ),
    );
  });

  it("retains the desktop ranking table and mobile clan card links", () => {
    render(
      <TCDBRankingTableClient
        serverData={serverDataWithClan}
        labels={labels}
        sportOptions={sportOptions}
      />,
    );

    const table = screen.getByRole("table", {
      name: "TCDB clan rankings table",
    });
    expect(
      within(table).getByRole("columnheader", { name: "Sport" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Name" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Cards" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Rank" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Trend" }),
    ).toBeInTheDocument();
    expect(within(table).getByText("Milwaukee Bucks")).toBeInTheDocument();
    expect(within(table).getByText("12,482")).toBeInTheDocument();

    const mobileList = screen.getByRole("list");
    expect(within(mobileList).getByText("Milwaukee Bucks")).toBeInTheDocument();
    expect(within(mobileList).getByText("Basketball")).toBeInTheDocument();
    expect(within(mobileList).getByText("12,482")).toBeInTheDocument();

    const links = screen.getAllByRole("link", {
      name: "View TCDB details for Milwaukee Bucks",
    });
    expect(links).toHaveLength(2);
    links.forEach((link) =>
      expect(link).toHaveAttribute("href", "/cardattack/clans/milwaukee-bucks"),
    );
  });
});
