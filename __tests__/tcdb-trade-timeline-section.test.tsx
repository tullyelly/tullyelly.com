import { render, screen } from "@testing-library/react";

const compileMdxToCodeMock = jest.fn();
const chronicleSectionMdxRendererMock = jest.fn(
  ({
    code,
  }: {
    code: string;
    postDate: string;
    components?: Record<string, unknown>;
  }) => <div data-testid="chronicle-section-mdx-renderer">{code}</div>,
);

jest.mock("@/lib/mdx/compile", () => ({
  compileMdxToCode: (...args: unknown[]) => compileMdxToCodeMock(...args),
}));
jest.mock("@/components/chronicles/ChronicleSectionMdxRenderer", () => ({
  ChronicleSectionMdxRenderer: (props: {
    code: string;
    postDate: string;
    components?: Record<string, unknown>;
  }) => chronicleSectionMdxRendererMock(props),
}));
jest.mock("@/components/media/FolderImageCarousel.server", () => ({
  __esModule: true,
  default: () => <div data-testid="folder-image-carousel" />,
}));
jest.mock("@/lib/datetime", () => ({
  fmtDate: (value: string) => value,
}));

import TcdbTradeChronicleFeed from "@/app/cardattack/tcdb-trades/[tradeId]/_components/TcdbTradeTimelineSection";

describe("TcdbTradeChronicleFeed", () => {
  beforeEach(() => {
    compileMdxToCodeMock.mockReset();
    chronicleSectionMdxRendererMock.mockClear();
    compileMdxToCodeMock.mockImplementation(async (source: string) => {
      return `compiled:${source}`;
    });
  });

  it("passes each trade section date into the shared chronicle section renderer", async () => {
    const days = [
      {
        tradeDate: "2026-04-01",
        side: "sent" as const,
        anchorId: "2026-04-01-sent",
        sourcePosts: [
          {
            slug: "trade-sent",
            url: "/shaolin/trade-sent",
            date: "2026-04-01",
            title: "trade sent",
          },
        ],
        sections: [
          {
            kind: "original" as const,
            postSlug: "trade-sent",
            postUrl: "/shaolin/trade-sent",
            postDate: "2026-04-01",
            postTitle: "trade sent",
            mdx: '<ReleaseSection tcdbTradeId="1000146">Sent it</ReleaseSection>',
          },
        ],
      },
      {
        tradeDate: "2026-04-03",
        side: "received" as const,
        anchorId: "2026-04-03-received",
        sourcePosts: [],
        sections: [
          {
            kind: "completed" as const,
            postSlug: "trade-received",
            postUrl: "/shaolin/trade-received",
            postDate: "2026-04-03",
            postTitle: "trade received",
            mdx: '<ReleaseSection tcdbTradeId="1000146" completed>Got it</ReleaseSection>',
          },
        ],
      },
    ];

    const ui = await TcdbTradeChronicleFeed({
      days,
      emptyMessage: "No trade days yet.",
      missingContentMessage: "Missing content.",
    });
    render(ui);

    expect(compileMdxToCodeMock).toHaveBeenCalledTimes(2);
    expect(chronicleSectionMdxRendererMock).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole("link", { name: "Chronicle: trade sent" }),
    ).toHaveAttribute("href", "/shaolin/trade-sent");

    const firstRendererProps = chronicleSectionMdxRendererMock.mock
      .calls[0]?.[0] as
      | {
          postDate?: string;
          components?: { ReleaseSection?: unknown };
        }
      | undefined;
    const secondRendererProps = chronicleSectionMdxRendererMock.mock
      .calls[1]?.[0] as
      | {
          postDate?: string;
          components?: { ReleaseSection?: unknown };
        }
      | undefined;

    expect(firstRendererProps?.postDate).toBe("2026-04-01");
    expect(firstRendererProps?.components?.ReleaseSection).toBeDefined();
    expect(secondRendererProps?.postDate).toBe("2026-04-03");
    expect(secondRendererProps?.components?.ReleaseSection).toBeDefined();
  });

  it("renders archived trade days", async () => {
    const ui = await TcdbTradeChronicleFeed({
      days: [
        {
          tradeDate: "2026-04-05",
          side: "archived" as const,
          anchorId: "2026-04-05-archived",
          sourcePosts: [],
          sections: [],
        },
      ],
      emptyMessage: "No trade days yet.",
      missingContentMessage: "Missing content.",
    });
    render(ui);

    expect(screen.getByText("Trade Archived")).toBeInTheDocument();
    expect(screen.getByText("Missing content.")).toBeInTheDocument();
    expect(compileMdxToCodeMock).not.toHaveBeenCalled();
  });
});
