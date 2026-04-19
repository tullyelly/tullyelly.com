import { render, screen } from "@testing-library/react";

const listLcsSummariesMock = jest.fn();
const lcsChronicleFeedMock = jest.fn(
  ({
    days,
    entryLabel,
  }: {
    days: Array<{ visitDate: string }>;
    entryLabel: string;
  }) => (
    <div data-testid="lcs-chronicle-feed">{`${entryLabel}:${days[0]?.visitDate ?? "none"}`}</div>
  ),
);

jest.mock("@/lib/lcs-content", () => ({
  listLcsSummaries: (...args: unknown[]) => listLcsSummariesMock(...args),
}));

jest.mock("@/lib/datetime", () => ({
  fmtDate: (value: string) => value,
}));

jest.mock("@/components/lcs/LcsChronicleFeed", () => ({
  __esModule: true,
  default: (props: {
    days: Array<{ visitDate: string }>;
    entryLabel: string;
  }) => lcsChronicleFeedMock(props),
}));

import CardattackLcsPage from "@/app/cardattack/lcs/page";
import LcsDetailPage from "@/components/lcs/LcsDetailPage";
import { getLcsRouteConfig } from "@/lib/lcs-route-config";

describe("lcs route pages", () => {
  beforeEach(() => {
    listLcsSummariesMock.mockReset();
    lcsChronicleFeedMock.mockClear();
  });

  it("renders the LCS landing page from DB-backed summaries", async () => {
    listLcsSummariesMock.mockResolvedValue([
      {
        slug: "indy-card-exchange",
        name: "Indy Card Exchange",
        city: "Indianapolis",
        state: "IN",
        rating: 8.7,
        visitCount: 2,
        latestVisitDate: "2026-02-16",
      },
    ]);

    const ui = await CardattackLcsPage();
    render(ui);

    expect(listLcsSummariesMock).toHaveBeenCalledWith();
    expect(
      screen.getByRole("heading", { name: "Local Card Shops" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Indy Card Exchange").length).toBeGreaterThan(0);
    expect(screen.getAllByText("8.7/10").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "Indy Card Exchange" })[0],
    ).toHaveAttribute("href", "/cardattack/lcs/indy-card-exchange");
  });

  it("renders the dedicated LCS detail page from DB metadata plus chronicle days", async () => {
    const ui = await LcsDetailPage({
      config: getLcsRouteConfig(),
      lcs: {
        slug: "indy-card-exchange",
        name: "Indy Card Exchange",
        city: "Indianapolis",
        state: "IN",
        rating: 8.7,
        url: "https://indycardexchange.com/",
        firstVisitDate: "2026-02-14",
        latestVisitDate: "2026-02-16",
        visitCount: 2,
        days: [
          {
            visitDate: "2026-02-14",
            sections: [
              {
                slug: "indy-card-exchange",
                postSlug: "scenario",
                postUrl: "/shaolin/scenario",
                postDate: "2026-02-14",
                postTitle: "scenario",
                mdx: '<ReleaseSection alterEgo="cardattack" lcs="indy-card-exchange">Visit</ReleaseSection>',
                sectionOrdinal: 1,
              },
            ],
            sourcePosts: [
              {
                slug: "scenario",
                title: "scenario",
                url: "/shaolin/scenario",
                date: "2026-02-14",
              },
            ],
          },
        ],
      },
    });
    render(ui);

    expect(screen.getAllByText("Indy Card Exchange").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "← Back to local card shops" }),
    ).toHaveAttribute("href", "/cardattack/lcs");
    expect(screen.getAllByText("Indianapolis, IN").length).toBeGreaterThan(0);
    expect(screen.getByText("Chronicle Feed")).toBeInTheDocument();
    expect(screen.getByText("indy-card-exchange")).toBeInTheDocument();
    expect(screen.getByText("8.7/10")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "https://indycardexchange.com/" })).toHaveAttribute(
      "href",
      "https://indycardexchange.com/",
    );
    expect(screen.getByTestId("lcs-chronicle-feed")).toHaveTextContent(
      "Visit:2026-02-14",
    );
    expect(lcsChronicleFeedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entryLabel: "Visit",
        days: [expect.objectContaining({ visitDate: "2026-02-14" })],
      }),
    );
  });
});
