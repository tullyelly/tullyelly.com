import { render, screen } from "@testing-library/react";

const listReviewSummariesMock = jest.fn();
const reviewChronicleFeedMock = jest.fn(
  ({
    entryLabel,
    sections,
  }: {
    entryLabel: string;
    sections: Array<{ postSlug: string }>;
  }) => (
    <div data-testid="review-chronicle-feed">{`${entryLabel}:${sections[0]?.postSlug ?? "none"}`}</div>
  ),
);

jest.mock("@/lib/review-content", () => ({
  listReviewSummaries: (...args: unknown[]) => listReviewSummariesMock(...args),
}));

jest.mock("@/lib/datetime", () => ({
  fmtDate: (value: string) => value,
}));

jest.mock("@/components/reviews/ReviewChronicleFeed", () => ({
  __esModule: true,
  default: (props: {
    entryLabel: string;
    sections: Array<{ postSlug: string }>;
  }) => reviewChronicleFeedMock(props),
}));

import UncleJimmyGoldenAgePage from "@/app/unclejimmy/golden-age/page";
import ReviewDetailPage from "@/components/reviews/ReviewDetailPage";
import { getReviewRouteConfig } from "@/lib/review-route-config";

describe("review route pages", () => {
  beforeEach(() => {
    listReviewSummariesMock.mockReset();
    reviewChronicleFeedMock.mockClear();
  });

  it("renders the golden age landing page from normalized review summaries", async () => {
    listReviewSummariesMock.mockResolvedValue([
      {
        reviewType: "golden-age",
        externalId: "little-red-barn",
        name: "Little Red Barn Antiques",
        averageRating: 8.8,
        visitCount: 1,
        latestPostDate: "2026-04-01",
      },
    ]);

    const ui = await UncleJimmyGoldenAgePage();
    render(ui);

    expect(listReviewSummariesMock).toHaveBeenCalledWith("golden-age");
    expect(
      screen.getByRole("heading", { name: "Golden Age" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Little Red Barn Antiques").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("8.8/10").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "Little Red Barn Antiques" })[0],
    ).toHaveAttribute("href", "/unclejimmy/golden-age/little-red-barn");
  });

  it("renders the shared review detail page from DB metadata plus MDX chronicle content", async () => {
    const ui = await ReviewDetailPage({
      config: getReviewRouteConfig("golden-age"),
      review: {
      reviewType: "golden-age",
      externalId: "little-red-barn",
      name: "Little Red Barn Antiques",
      summary: {
        averageRating: 8.8,
        visitCount: 1,
        latestPostDate: "2026-04-01",
      },
      sections: [
        {
          reviewType: "golden-age",
          externalId: "little-red-barn",
          name: "Little Red Barn Antiques",
          postSlug: "self-care",
          postUrl: "/shaolin/self-care",
          postDate: "2026-04-01",
          postTitle: "self care",
          mdx: '<ReleaseSection alterEgo="unclejimmy" review={{ type: "golden-age", id: "little-red-barn" }}>Treasure hunt</ReleaseSection>',
          sectionOrdinal: 1,
        },
      ],
      },
    });
    render(ui);

    expect(
      screen.getAllByText("Little Red Barn Antiques").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "← Back to golden age" }),
    ).toHaveAttribute("href", "/unclejimmy/golden-age");
    expect(screen.getByText("Chronicle Feed")).toBeInTheDocument();
    expect(screen.getByTestId("review-chronicle-feed")).toHaveTextContent(
      "Visit:self-care",
    );
    expect(reviewChronicleFeedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entryLabel: "Visit",
        sections: [
          expect.objectContaining({
            postSlug: "self-care",
            mdx: expect.stringContaining("Treasure hunt"),
          }),
        ],
      }),
    );
    expect(screen.getByText("8.8/10")).toBeInTheDocument();
  });
});
