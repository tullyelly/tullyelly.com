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

import SavePointSections from "@/components/unclejimmy/SavePointSections";
import SavePointListClient from "@/app/unclejimmy/call-a-save-point/_components/SavePointListClient";

describe("SavePointListClient", () => {
  it("renders an empty state when no rows are available", () => {
    render(<SavePointListClient rows={[]} />);

    expect(
      screen.getAllByText(
        "No save point reviews have been referenced in chronicles yet.",
      ),
    ).toHaveLength(2);
  });

  it("renders rows with detail links and average ratings", () => {
    render(
      <SavePointListClient
        rows={[
          {
            savePointId: "mewgenics",
            savePointName: "Mewgenics",
            savePointUrl: "https://mewgenics.wiki.gg/",
            averageRating: 9.5,
            visitCount: 2,
            latestPostDate: "2026-03-03",
          },
        ]}
      />,
    );

    expect(screen.getAllByText("Mewgenics").length).toBeGreaterThan(0);
    expect(screen.getAllByText("9.5/10").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "Mewgenics" })[0],
    ).toHaveAttribute("href", "/unclejimmy/call-a-save-point/mewgenics");
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });
});

describe("SavePointSections", () => {
  beforeEach(() => {
    compileMdxToCodeMock.mockReset();
    mdxRendererMock.mockClear();
    compileMdxToCodeMock.mockImplementation(async (source: string) => {
      return `compiled:${source}`;
    });
  });

  it("compiles sections, disables nested dividers, and renders jump links", async () => {
    const sections = [
      {
        savePointId: "mewgenics",
        postSlug: "review-one",
        postUrl: "/shaolin/review-one",
        postDate: "2026-03-02",
        postTitle: "Review One",
        savePointName: "Mewgenics",
        savePointRating: "9.5/10",
        mdx: `<ReleaseSection alterEgo="unclejimmy" divider={true} review={{ type: "save-point", id: "mewgenics", name: "Mewgenics", rating: "9.5/10" }}>Review one</ReleaseSection>`,
      },
      {
        savePointId: "mewgenics",
        postSlug: "review-two",
        postUrl: "/shaolin/review-two",
        postDate: "2026-03-03",
        postTitle: "Review Two",
        savePointName: "Mewgenics",
        savePointRating: "9.7/10",
        mdx: `<ReleaseSection alterEgo="unclejimmy" review={{ type: "save-point", id: "mewgenics", name: "Mewgenics", rating: "9.7/10" }}>Review two</ReleaseSection>`,
      },
    ];

    const ui = await SavePointSections({ sections });
    render(ui);

    expect(compileMdxToCodeMock).toHaveBeenCalledTimes(2);
    const firstCall = String(compileMdxToCodeMock.mock.calls[0]?.[0] ?? "");
    const secondCall = String(compileMdxToCodeMock.mock.calls[1]?.[0] ?? "");
    expect(firstCall).toContain("divider={false}");
    expect(firstCall).not.toContain("divider={true}");
    expect(secondCall).toContain("divider={false}");

    expect(
      screen.getByRole("link", { name: "Jump to Review 1" }),
    ).toHaveAttribute("href", "#review-review-one-1");
    expect(
      screen.getByRole("link", { name: "Jump to Review 2" }),
    ).toHaveAttribute("href", "#review-review-two-1");

    expect(screen.getByText(/2026-03-02: Review 1/)).toBeInTheDocument();
    expect(screen.getByText(/2026-03-03: Review 2/)).toBeInTheDocument();

    const originalLinks = screen.getAllByRole("link", { name: "(original post)" });
    expect(originalLinks).toHaveLength(2);
    expect(originalLinks[0]).toHaveAttribute("href", "/shaolin/review-one");
    expect(originalLinks[1]).toHaveAttribute("href", "/shaolin/review-two");

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
