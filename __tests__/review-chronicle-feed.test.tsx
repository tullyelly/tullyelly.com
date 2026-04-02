import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const compileMdxToCodeMock = jest.fn();
const mdxRendererMock = jest.fn(
  ({ code }: { code: string; components?: unknown }) => (
    <div data-testid="mdx-renderer">{code}</div>
  ),
);

jest.mock("@/lib/mdx/compile", () => ({
  compileMdxToCode: (...args: unknown[]) => compileMdxToCodeMock(...args),
}));

jest.mock("@/components/mdx-renderer", () => ({
  MdxRenderer: (props: { code: string; components?: unknown }) =>
    mdxRendererMock(props),
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

import ReviewChronicleFeed from "@/components/reviews/ReviewChronicleFeed";

describe("ReviewChronicleFeed", () => {
  beforeEach(() => {
    compileMdxToCodeMock.mockReset();
    mdxRendererMock.mockClear();
    compileMdxToCodeMock.mockImplementation(async (source: string) => {
      return `compiled:${source}`;
    });
  });

  it("compiles review MDX, disables nested dividers, and renders jump links", async () => {
    const sections = [
      {
        reviewType: "golden-age" as const,
        externalId: "little-red-barn",
        name: "Little Red Barn Antiques",
        postSlug: "self-care",
        postUrl: "/shaolin/self-care",
        postDate: "2026-04-01",
        postTitle: "self care",
        mdx: '<ReleaseSection alterEgo="unclejimmy" divider={true} review={{ type: "golden-age", id: "little-red-barn" }}>Treasure hunt</ReleaseSection>',
        sectionOrdinal: 1,
      },
      {
        reviewType: "golden-age" as const,
        externalId: "little-red-barn",
        name: "Little Red Barn Antiques",
        postSlug: "hooky",
        postUrl: "/shaolin/hooky",
        postDate: "2026-04-03",
        postTitle: "hooky",
        mdx: '<ReleaseSection alterEgo="unclejimmy" review={{ type: "golden-age", id: "little-red-barn" }}>Second stop</ReleaseSection>',
        sectionOrdinal: 1,
      },
    ];

    const ui = await ReviewChronicleFeed({
      sections,
      entryLabel: "Visit",
      emptyMessage: "Nothing here yet.",
    });
    render(ui);

    expect(compileMdxToCodeMock).toHaveBeenCalledTimes(2);
    const firstCall = String(compileMdxToCodeMock.mock.calls[0]?.[0] ?? "");
    const secondCall = String(compileMdxToCodeMock.mock.calls[1]?.[0] ?? "");
    expect(firstCall).toContain("divider={false}");
    expect(firstCall).not.toContain("divider={true}");
    expect(secondCall).toContain("divider={false}");

    expect(
      screen.getByRole("navigation", { name: "Visit jump links" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Visit 1" })).toHaveAttribute(
      "href",
      "#visit-self-care-1",
    );
    expect(screen.getByRole("link", { name: "Visit 2" })).toHaveAttribute(
      "href",
      "#visit-hooky-1",
    );

    expect(screen.getByText("2026-04-01")).toBeInTheDocument();
    expect(screen.getByText("2026-04-03")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Original Chronicle: self care" }),
    ).toHaveAttribute("href", "/shaolin/self-care");
    expect(
      screen.getByRole("link", { name: "Original Chronicle: hooky" }),
    ).toHaveAttribute("href", "/shaolin/hooky");

    const mdxRendered = screen.getAllByTestId("mdx-renderer");
    expect(mdxRendered).toHaveLength(2);
    expect(mdxRendered[0]).toHaveTextContent("compiled:");
    expect(mdxRendered[1]).toHaveTextContent("compiled:");

    const firstMdxProps = mdxRendererMock.mock.calls[0]?.[0] as
      | { components?: { ReleaseSection?: unknown } }
      | undefined;
    expect(firstMdxProps?.components?.ReleaseSection).toBeDefined();
  });
});
