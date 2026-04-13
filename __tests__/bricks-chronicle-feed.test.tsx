import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

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

jest.mock("@/lib/datetime", () => ({
  fmtDate: (value: string) => value,
}));

jest.mock("@/components/mdx/ReleaseSection", () => ({
  __esModule: true,
  default: ({ children }: { children?: ReactNode }) => (
    <div data-testid="release-section">{children}</div>
  ),
}));

import BricksChronicleFeed from "@/components/bricks/BricksChronicleFeed";

describe("BricksChronicleFeed", () => {
  beforeEach(() => {
    compileMdxToCodeMock.mockReset();
    chronicleSectionMdxRendererMock.mockClear();
    compileMdxToCodeMock.mockImplementation(async (source: string) => {
      return `compiled:${source}`;
    });
  });

  it("compiles build-session MDX, disables nested dividers, and renders bags plus source links", async () => {
    const days = [
      {
        buildDate: "2026-04-03",
        bags: "4-6",
        sourcePosts: [
          {
            slug: "saturday-oooh-ooooh",
            title: "saturday oooh ooooh",
            url: "/shaolin/saturday-oooh-ooooh",
            date: "2026-04-03",
          },
        ],
        sections: [
          {
            subset: "lego" as const,
            publicId: "10330",
            postSlug: "saturday-oooh-ooooh",
            postUrl: "/shaolin/saturday-oooh-ooooh",
            postDate: "2026-04-03",
            postTitle: "saturday oooh ooooh",
            mdx: '<ReleaseSection alterEgo="unclejimmy" bricks={{ type: "lego", id: "10330" }}>Finishing touches</ReleaseSection>',
            sectionOrdinal: 1,
          },
        ],
      },
      {
        buildDate: "2026-04-01",
        bags: "1-3",
        sourcePosts: [
          {
            slug: "timeout",
            title: "timeout",
            url: "/shaolin/timeout",
            date: "2026-04-01",
          },
        ],
        sections: [
          {
            subset: "lego" as const,
            publicId: "10330",
            postSlug: "timeout",
            postUrl: "/shaolin/timeout",
            postDate: "2026-04-01",
            postTitle: "timeout",
            mdx: '<ReleaseSection alterEgo="unclejimmy" divider={true} bricks={{ type: "lego", id: "10330" }}>Opening bags</ReleaseSection>',
            sectionOrdinal: 1,
          },
        ],
      },
    ];

    const ui = await BricksChronicleFeed({
      days,
      entryLabel: "Build Session",
      emptyMessage: "Nothing here yet.",
      missingContentMessage: "Missing content.",
    });
    const { container } = render(ui);

    expect(compileMdxToCodeMock).toHaveBeenCalledTimes(2);
    const firstCall = String(compileMdxToCodeMock.mock.calls[0]?.[0] ?? "");
    expect(firstCall).toContain("divider={false}");
    expect(firstCall).not.toContain("divider={true}");

    expect(screen.getByText("2026-04-01")).toBeInTheDocument();
    expect(screen.getByText("2026-04-03")).toBeInTheDocument();
    const renderedText = container.textContent ?? "";
    expect(renderedText.indexOf("2026-04-01")).toBeLessThan(
      renderedText.indexOf("2026-04-03"),
    );
    expect(screen.getByText("Bags 1-3")).toBeInTheDocument();
    expect(screen.getByText("Bags 4-6")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Chronicle: timeout" }),
    ).toHaveAttribute("href", "/shaolin/timeout");
    expect(
      screen.getByRole("link", { name: "Chronicle: saturday oooh ooooh" }),
    ).toHaveAttribute("href", "/shaolin/saturday-oooh-ooooh");

    const mdxRendered = screen.getAllByTestId("chronicle-section-mdx-renderer");
    expect(mdxRendered).toHaveLength(2);
    expect(mdxRendered[0]).toHaveTextContent("compiled:");
    expect(mdxRendered[1]).toHaveTextContent("compiled:");

    const firstMdxProps = chronicleSectionMdxRendererMock.mock.calls[0]?.[0] as
      | {
          postDate?: string;
          components?: { ReleaseSection?: unknown };
        }
      | undefined;
    expect(firstMdxProps?.postDate).toBe("2026-04-01");
    expect(firstMdxProps?.components?.ReleaseSection).toBeDefined();
  });
});
