import { render, screen } from "@testing-library/react";

const getAllTableSchemaSummariesMock = jest.fn();
const compileMdxToCodeMock = jest.fn();

jest.mock("@/lib/table-schema", () => ({
  getAllTableSchemaSummaries: (...args: unknown[]) =>
    getAllTableSchemaSummariesMock(...args),
}));

jest.mock("@/lib/mdx/compile", () => ({
  compileMdxToCode: (...args: unknown[]) => compileMdxToCodeMock(...args),
}));

jest.mock("@/components/mdx-renderer", () => ({
  MdxRenderer: ({ code }: { code: string }) => (
    <div data-testid="mdx-renderer">{code}</div>
  ),
}));

jest.mock("@/lib/datetime", () => ({
  fmtDate: (value: string) => value,
}));

import TableSchemaDirectory from "@/components/unclejimmy/TableSchemaDirectory";
import TableSchemaSections from "@/components/unclejimmy/TableSchemaSections";

describe("TableSchemaDirectory", () => {
  beforeEach(() => {
    getAllTableSchemaSummariesMock.mockReset();
  });

  it("renders an empty state when no summaries are available", () => {
    getAllTableSchemaSummariesMock.mockReturnValue([]);

    render(<TableSchemaDirectory />);

    expect(screen.getByRole("heading", { name: "Table Schema" })).toBeInTheDocument();
    expect(
      screen.getByText("No Table Schema visits are published yet."),
    ).toBeInTheDocument();
  });

  it("renders summary rows with ratings and links", () => {
    getAllTableSchemaSummariesMock.mockReturnValue([
      {
        tableSchemaId: "pizza-shack",
        tableSchemaName: "Pizza Shack",
        averageRating: 8.7,
        latestPostDate: "2026-02-14",
      },
      {
        tableSchemaId: "burger-barn",
        tableSchemaName: "Burger Barn",
        averageRating: 9.2,
        latestPostDate: "2026-02-15",
      },
    ]);

    render(<TableSchemaDirectory />);

    expect(screen.getByText("Pizza Shack")).toBeInTheDocument();
    expect(screen.getByText("Burger Barn")).toBeInTheDocument();
    expect(screen.getByText("Average rating: 8.7/10")).toBeInTheDocument();
    expect(screen.getByText("Average rating: 9.2/10")).toBeInTheDocument();
    const visitLinks = screen.getAllByRole("link", { name: "view visits" });
    expect(visitLinks).toHaveLength(2);
    expect(visitLinks[0]).toHaveAttribute(
      "href",
      "/unclejimmy/table-schema/pizza-shack",
    );
  });
});

describe("TableSchemaSections", () => {
  beforeEach(() => {
    compileMdxToCodeMock.mockReset();
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
  });
});
