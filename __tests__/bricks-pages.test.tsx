import { render, screen } from "@testing-library/react";

const listBricksSummariesMock = jest.fn();
const bricksChronicleFeedMock = jest.fn(
  ({
    days,
    entryLabel,
  }: {
    days: Array<{ buildDate: string }>;
    entryLabel: string;
  }) => (
    <div data-testid="bricks-chronicle-feed">{`${entryLabel}:${days[0]?.buildDate ?? "none"}`}</div>
  ),
);

jest.mock("@/lib/bricks-content", () => ({
  listBricksSummaries: (...args: unknown[]) => listBricksSummariesMock(...args),
}));

jest.mock("@/lib/datetime", () => ({
  fmtDate: (value: string) => value,
}));

jest.mock("@/components/bricks/BricksChronicleFeed", () => ({
  __esModule: true,
  default: (props: {
    days: Array<{ buildDate: string }>;
    entryLabel: string;
  }) => bricksChronicleFeedMock(props),
}));

import UncleJimmyBricksLegoPage from "@/app/unclejimmy/bricks/page";
import BricksDetailPage from "@/components/bricks/BricksDetailPage";
import { getBricksRouteConfig } from "@/lib/bricks-route-config";

describe("bricks route pages", () => {
  beforeEach(() => {
    listBricksSummariesMock.mockReset();
    bricksChronicleFeedMock.mockClear();
  });

  it("renders the bricks lego landing page from DB-backed summaries", async () => {
    listBricksSummariesMock.mockResolvedValue([
      {
        subset: "lego",
        publicId: "10330",
        setName: "McLaren MP4/4 & Ayrton Senna",
        tag: "f1",
        pieceCount: 693,
        reviewScore: 9.3,
        sessionCount: 2,
        latestBuildDate: "2026-04-03",
      },
    ]);

    const ui = await UncleJimmyBricksLegoPage();
    render(ui);

    expect(listBricksSummariesMock).toHaveBeenCalledWith("lego");
    expect(
      screen.getByRole("heading", { name: "Bricks: LEGO" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("McLaren MP4/4 & Ayrton Senna").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("9.3/10").length).toBeGreaterThan(0);
    expect(screen.getAllByText("LEGO ID 10330").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "McLaren MP4/4 & Ayrton Senna" })[0],
    ).toHaveAttribute("href", "/unclejimmy/bricks/10330");
  });

  it("renders the bricks detail page from DB metadata plus MDX chronicle content", async () => {
    const ui = await BricksDetailPage({
      config: getBricksRouteConfig("lego"),
      bricks: {
        subset: "lego",
        publicId: "10330",
        setName: "McLaren MP4/4 & Ayrton Senna",
        tag: "f1",
        pieceCount: 693,
        reviewScore: 9.3,
        firstBuildDate: "2026-04-01",
        latestBuildDate: "2026-04-03",
        sessionCount: 2,
        days: [
          {
            buildDate: "2026-04-01",
            bags: "1-3",
            sections: [
              {
                subset: "lego",
                publicId: "10330",
                postSlug: "timeout",
                postUrl: "/shaolin/timeout",
                postDate: "2026-04-01",
                postTitle: "timeout",
                mdx: '<ReleaseSection alterEgo="unclejimmy" bricks="10330">Opening bags</ReleaseSection>',
                sectionOrdinal: 1,
              },
            ],
            sourcePosts: [
              {
                slug: "timeout",
                title: "timeout",
                url: "/shaolin/timeout",
                date: "2026-04-01",
              },
            ],
          },
        ],
      },
    });
    render(ui);

    expect(
      screen.getAllByText("McLaren MP4/4 & Ayrton Senna").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "← Back to Bricks: LEGO" }),
    ).toHaveAttribute("href", "/unclejimmy/bricks");
    expect(screen.getByText("Chronicle Feed")).toBeInTheDocument();
    expect(screen.getByText("LEGO ID")).toBeInTheDocument();
    expect(screen.getByText("693")).toBeInTheDocument();
    expect(screen.getByText("f1")).toBeInTheDocument();
    expect(screen.getByText("9.3/10")).toBeInTheDocument();
    expect(screen.getByTestId("bricks-chronicle-feed")).toHaveTextContent(
      "Build Session:2026-04-01",
    );
    expect(bricksChronicleFeedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entryLabel: "Build Session",
        days: [expect.objectContaining({ buildDate: "2026-04-01" })],
      }),
    );
  });
});
