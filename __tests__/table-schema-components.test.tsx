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

import TableSchemaSections from "@/components/unclejimmy/TableSchemaSections";
import TableSchemaListClient from "@/app/unclejimmy/table-schema/_components/TableSchemaListClient";

describe("TableSchemaListClient", () => {
  it("renders an empty state when no rows are available", () => {
    render(<TableSchemaListClient rows={[]} />);

    expect(
      screen.getAllByText(
        "No table schema reviews have been referenced in chronicles yet.",
      ),
    ).toHaveLength(2);
  });

  it("renders rows with detail links and average ratings", () => {
    render(
      <TableSchemaListClient
        rows={[
          {
            tableSchemaId: "pizza-shack",
            tableSchemaName: "Pizza Shack",
            tableSchemaUrl: "https://pizza-shack.example.com/",
            averageRating: 8.7,
            visitCount: 2,
            latestPostDate: "2026-03-01",
          },
        ]}
      />,
    );

    expect(screen.getAllByText("Pizza Shack").length).toBeGreaterThan(0);
    expect(screen.getAllByText("8.7/10").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "Pizza Shack" })[0],
    ).toHaveAttribute("href", "/unclejimmy/table-schema/pizza-shack");
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });
});

describe("TableSchemaSections", () => {
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
        tableSchemaId: "1",
        postSlug: "visit-one",
        postUrl: "/shaolin/visit-one",
        postDate: "2026-02-14",
        postTitle: "Visit One",
        tableSchemaName: "Pizza Shack",
        tableSchemaRating: "9/10",
        mdx: `<ReleaseSection alterEgo="unclejimmy" divider={true} review={{ type: "table-schema", id: 1, name: "Pizza Shack", rating: "9/10" }}>Visit one</ReleaseSection>`,
      },
      {
        tableSchemaId: "1",
        postSlug: "visit-two",
        postUrl: "/shaolin/visit-two",
        postDate: "2026-02-15",
        postTitle: "Visit Two",
        tableSchemaName: "Pizza Shack",
        tableSchemaRating: "8.5/10",
        mdx: `<ReleaseSection alterEgo="unclejimmy" review={{ type: "table-schema", id: 1, name: "Pizza Shack", rating: "8.5/10" }}>Visit two</ReleaseSection>`,
      },
    ];

    const ui = await TableSchemaSections({ sections });
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
