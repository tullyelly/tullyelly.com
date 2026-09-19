import { fireEvent, render, screen, within } from "@testing-library/react";

jest.mock("@/lib/datetime", () => ({
  fmtDate: (value: string) => value,
}));

import LcsListClient from "@/components/lcs/LcsListClient";
import UspsListClient from "@/components/usps/UspsListClient";
import { lcsTableThemeStyle } from "@/lib/lcs-theme";
import { uspsTableThemeStyle } from "@/lib/usps-theme";

const sharedProps = {
  detailBasePath: "/cardattack/directory",
  ratingLabel: "Rating",
  countLabel: "Visits",
  firstCountLabel: "First visit",
  latestCountLabel: "Latest visit",
  emptyMessage: "Nothing here.",
  tableAriaLabel: "Directory",
};

function desktopNames(rowTestId: string): string[] {
  return screen
    .getAllByTestId(rowTestId)
    .map((row) => within(row).getAllByRole("link")[0].textContent ?? "");
}

describe("visit directory controls", () => {
  it("derives LCS states and composes state filtering with search and sorting", () => {
    render(
      <LcsListClient
        {...sharedProps}
        shopLabel="Shop"
        locationLabel="Location"
        siteLabel="Website"
        rowTestId="lcs-control-row"
        themeStyle={lcsTableThemeStyle}
        rows={[
          {
            slug: "zulu-cards",
            name: "Zulu Cards",
            city: "Austin",
            state: "TX",
            rating: 9.5,
            visitCount: 2,
            latestVisitDate: "2026-01-01",
          },
          {
            slug: "alpha-sports",
            name: "Alpha Sports",
            city: "Dallas",
            state: "TX",
            rating: 8.5,
            visitCount: 7,
            latestVisitDate: "2026-03-01",
          },
          {
            slug: "midwest-cards",
            name: "Midwest Cards",
            city: "Chicago",
            state: "IL",
            rating: 10,
            visitCount: 3,
            latestVisitDate: "2026-02-01",
          },
        ]}
      />,
    );

    const stateSelect = screen.getByRole("combobox", {
      name: "Filter card shops by state",
    });
    expect(
      within(stateSelect)
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["All states", "IL", "TX"]);
    expect(screen.getByTestId("lcs-table").parentElement).toHaveStyle({
      "--table-head-background":
        "linear-gradient(135deg, var(--lcs-accent) 0%, var(--lcs-accent-deep) 100%)",
      "--table-head-text": "var(--white)",
    });
    expect(desktopNames("lcs-control-row")).toEqual([
      "Alpha Sports",
      "Midwest Cards",
      "Zulu Cards",
    ]);

    fireEvent.change(
      screen.getByRole("combobox", { name: "Sort card shops" }),
      { target: { value: "rating" } },
    );
    expect(desktopNames("lcs-control-row")).toEqual([
      "Midwest Cards",
      "Zulu Cards",
      "Alpha Sports",
    ]);

    fireEvent.change(
      screen.getByRole("combobox", { name: "Sort card shops" }),
      { target: { value: "name" } },
    );
    expect(desktopNames("lcs-control-row")).toEqual([
      "Alpha Sports",
      "Midwest Cards",
      "Zulu Cards",
    ]);

    fireEvent.change(stateSelect, { target: { value: "TX" } });
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search card shops" }),
      {
        target: { value: "alpha" },
      },
    );
    expect(desktopNames("lcs-control-row")).toEqual(["Alpha Sports"]);
    expect(screen.getByRole("status")).toHaveTextContent("1 card shop");
  });

  it("sorts USPS rows and composes state filtering with search", () => {
    render(
      <UspsListClient
        {...sharedProps}
        locationLabel="Location"
        stateLabel="State"
        rowTestId="usps-control-row"
        themeStyle={uspsTableThemeStyle}
        rows={[
          {
            citySlug: "austin",
            cityName: "Austin",
            state: "TX",
            rating: 9,
            visitCount: 2,
            latestVisitDate: "2026-01-01",
          },
          {
            citySlug: "dallas",
            cityName: "Dallas",
            state: "TX",
            rating: 8,
            visitCount: 8,
            latestVisitDate: "2026-03-01",
          },
          {
            citySlug: "chicago",
            cityName: "Chicago",
            state: "IL",
            rating: 10,
            visitCount: 4,
            latestVisitDate: "2026-02-01",
          },
        ]}
      />,
    );

    expect(desktopNames("usps-control-row")).toEqual([
      "Dallas",
      "Chicago",
      "Austin",
    ]);
    expect(screen.getByTestId("usps-table").parentElement).toHaveStyle({
      "--table-head-background":
        "linear-gradient(135deg, var(--usps-accent) 0%, var(--usps-accent-deep) 100%)",
      "--table-head-text": "var(--white)",
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: "Sort USPS locations" }),
      { target: { value: "visits" } },
    );
    expect(desktopNames("usps-control-row")).toEqual([
      "Dallas",
      "Chicago",
      "Austin",
    ]);

    fireEvent.change(
      screen.getByRole("combobox", {
        name: "Filter USPS locations by state",
      }),
      { target: { value: "TX" } },
    );
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search USPS locations" }),
      { target: { value: "aus" } },
    );
    expect(desktopNames("usps-control-row")).toEqual(["Austin"]);
    expect(screen.getByRole("status")).toHaveTextContent("1 USPS location");
  });
});
