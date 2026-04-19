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

import LcsChronicleFeed from "@/components/lcs/LcsChronicleFeed";

describe("LcsChronicleFeed", () => {
  beforeEach(() => {
    compileMdxToCodeMock.mockReset();
    chronicleSectionMdxRendererMock.mockClear();
    compileMdxToCodeMock.mockImplementation(async (source: string) => {
      return `compiled:${source}`;
    });
  });

  it("compiles visit-day MDX, disables nested dividers, sorts days, and renders missing-content days cleanly", async () => {
    const days = [
      {
        visitDate: "2026-02-16",
        sourcePosts: [
          {
            slug: "later-visit",
            title: "later visit",
            url: "/shaolin/later-visit",
            date: "2026-02-16",
          },
        ],
        sections: [
          {
            slug: "indy-card-exchange",
            postSlug: "later-visit",
            postUrl: "/shaolin/later-visit",
            postDate: "2026-02-16",
            postTitle: "later visit",
            mdx: '<ReleaseSection alterEgo="cardattack" lcs="indy-card-exchange">Later</ReleaseSection>',
            sectionOrdinal: 1,
          },
        ],
      },
      {
        visitDate: "2026-02-14",
        sourcePosts: [
          {
            slug: "earlier-visit",
            title: "earlier visit",
            url: "/shaolin/earlier-visit",
            date: "2026-02-14",
          },
        ],
        sections: [
          {
            slug: "indy-card-exchange",
            postSlug: "earlier-visit",
            postUrl: "/shaolin/earlier-visit",
            postDate: "2026-02-14",
            postTitle: "earlier visit",
            mdx: '<ReleaseSection alterEgo="cardattack" divider={true} lcs="indy-card-exchange">Earlier</ReleaseSection>',
            sectionOrdinal: 1,
          },
        ],
      },
      {
        visitDate: "2026-02-17",
        sourcePosts: [],
        sections: [],
      },
    ];

    const ui = await LcsChronicleFeed({
      days,
      entryLabel: "Visit",
      emptyMessage: "Nothing here yet.",
      missingContentMessage: "Missing content.",
    });
    const { container } = render(ui);

    expect(compileMdxToCodeMock).toHaveBeenCalledTimes(2);
    const firstCall = String(compileMdxToCodeMock.mock.calls[0]?.[0] ?? "");
    expect(firstCall).toContain("divider={false}");
    expect(firstCall).not.toContain("divider={true}");

    expect(screen.getByText("2026-02-14")).toBeInTheDocument();
    expect(screen.getByText("2026-02-16")).toBeInTheDocument();
    expect(screen.getByText("2026-02-17")).toBeInTheDocument();
    const renderedText = container.textContent ?? "";
    expect(renderedText.indexOf("2026-02-14")).toBeLessThan(
      renderedText.indexOf("2026-02-16"),
    );
    expect(renderedText.indexOf("2026-02-16")).toBeLessThan(
      renderedText.indexOf("2026-02-17"),
    );
    expect(
      screen.getByRole("link", { name: "Chronicle: earlier visit" }),
    ).toHaveAttribute("href", "/shaolin/earlier-visit");
    expect(
      screen.getByRole("link", { name: "Chronicle: later visit" }),
    ).toHaveAttribute("href", "/shaolin/later-visit");
    expect(screen.getByText("Missing content.")).toBeInTheDocument();

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
    expect(firstMdxProps?.postDate).toBe("2026-02-14");
    expect(firstMdxProps?.components?.ReleaseSection).toBeDefined();
  });
});
