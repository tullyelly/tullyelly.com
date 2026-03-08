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

import LcsSections from "@/components/cardattack/LcsSections";
import LcsListClient from "@/app/cardattack/lcs/_components/LcsListClient";

describe("LcsListClient", () => {
  it("renders an empty state when no rows are available", () => {
    render(<LcsListClient rows={[]} />);

    expect(
      screen.getAllByText(
        "No local card shop reviews have been referenced in chronicles yet.",
      ),
    ).toHaveLength(2);
  });

  it("renders rows with detail links and average ratings", () => {
    render(
      <LcsListClient
        rows={[
          {
            lcsId: "indy-card-exchange",
            lcsName: "Indy Card Exchange",
            lcsUrl: "https://indycardexchange.com/",
            averageRating: 8.7,
            visitCount: 2,
            latestPostDate: "2026-03-01",
          },
        ]}
      />,
    );

    expect(screen.getAllByText("Indy Card Exchange").length).toBeGreaterThan(0);
    expect(screen.getAllByText("8.7/10").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "Indy Card Exchange" })[0],
    ).toHaveAttribute("href", "/cardattack/lcs/indy-card-exchange");
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });
});

describe("LcsSections", () => {
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
        lcsId: "indy-card-exchange",
        postSlug: "visit-one",
        postUrl: "/shaolin/visit-one",
        postDate: "2026-02-14",
        postTitle: "Visit One",
        lcsName: "Indy Card Exchange",
        lcsUrl: "https://indycardexchange.com/",
        lcsRating: "8.7/10",
        mdx: `<ReleaseSection alterEgo="cardattack" divider={true} review={{ type: "lcs", id: "indy-card-exchange", name: "Indy Card Exchange", rating: "8.7/10" }}>Visit one</ReleaseSection>`,
      },
      {
        lcsId: "indy-card-exchange",
        postSlug: "visit-two",
        postUrl: "/shaolin/visit-two",
        postDate: "2026-02-15",
        postTitle: "Visit Two",
        lcsName: "Indy Card Exchange",
        lcsUrl: "https://indycardexchange.com/",
        lcsRating: "8.9/10",
        mdx: `<ReleaseSection alterEgo="cardattack" review={{ type: "lcs", id: "indy-card-exchange", name: "Indy Card Exchange", rating: "8.9/10" }}>Visit two</ReleaseSection>`,
      },
    ];

    const ui = await LcsSections({ sections });
    render(ui);

    expect(compileMdxToCodeMock).toHaveBeenCalledTimes(2);
    const firstCall = String(compileMdxToCodeMock.mock.calls[0]?.[0] ?? "");
    const secondCall = String(compileMdxToCodeMock.mock.calls[1]?.[0] ?? "");
    expect(firstCall).toContain("divider={false}");
    expect(firstCall).not.toContain("divider={true}");
    expect(secondCall).toContain("divider={false}");

    expect(screen.getByRole("link", { name: "Jump to Visit 1" })).toHaveAttribute(
      "href",
      "#visit-visit-one-1",
    );
    expect(screen.getByRole("link", { name: "Jump to Visit 2" })).toHaveAttribute(
      "href",
      "#visit-visit-two-1",
    );

    expect(screen.getByText(/2026-02-14: Visit 1/)).toBeInTheDocument();
    expect(screen.getByText(/2026-02-15: Visit 2/)).toBeInTheDocument();

    const originalLinks = screen.getAllByRole("link", { name: "(original post)" });
    expect(originalLinks).toHaveLength(2);
    expect(originalLinks[0]).toHaveAttribute("href", "/shaolin/visit-one");
    expect(originalLinks[1]).toHaveAttribute("href", "/shaolin/visit-two");

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
