import { fireEvent, render, screen, within } from "@testing-library/react";
import TagDirectoryClient, {
  type TagDirectoryRow,
} from "@/app/shaolin/tags/_components/TagDirectoryClient";

const rows: TagDirectoryRow[] = [
  {
    slug: "zeta",
    canonicalDisplayName: "Zeta Person",
    chronicleCount: 2,
    alias: { href: "/zeta", label: "Alter ego page", external: false },
    personTagNames: [
      { displayName: "Z", count: 4 },
      { displayName: "Zed", count: 2 },
    ],
    remainingPersonTagNameCount: 1,
  },
  {
    slug: "alpha",
    canonicalDisplayName: "Alpha Person",
    chronicleCount: 5,
    alias: null,
    personTagNames: [],
    remainingPersonTagNameCount: 0,
  },
  {
    slug: "doom",
    canonicalDisplayName: "Metal Face",
    chronicleCount: 3,
    alias: null,
    personTagNames: [],
    remainingPersonTagNameCount: 0,
  },
];

function desktopRows() {
  return Array.from(
    screen
      .getByRole("table", { name: "Chronicle tags table" })
      .querySelectorAll<HTMLElement>("tbody tr"),
  );
}

describe("TagDirectoryClient", () => {
  it("renders linked desktop and mobile representations ordered by usage", () => {
    const { container } = render(<TagDirectoryClient rows={rows} />);

    const table = screen.getByRole("table", { name: "Chronicle tags table" });
    expect(table).toHaveClass("table-fixed");
    expect(
      within(table).getByRole("columnheader", { name: "Tag" }),
    ).toHaveClass("w-1/5");
    expect(
      within(table).getByRole("columnheader", { name: "Also found at" }),
    ).toHaveClass("w-44");
    expect(container.querySelector("ul.md\\:hidden")).toBeInTheDocument();

    expect(
      within(desktopRows()[0]).getByRole("link", { name: "#alpha" }),
    ).toHaveAttribute("href", "/shaolin/tags/alpha");
    expect(within(desktopRows()[0]).getByText("5")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "#doom" })).toHaveLength(2);
    expect(screen.getAllByText("None")).toHaveLength(8);
    expect(
      screen.getAllByRole("link", { name: "Alter ego page" }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("link", { name: "Alter ego page" })[0],
    ).toHaveAttribute("href", "/zeta");
    expect(screen.getAllByText("Z (4)")).toHaveLength(2);
    expect(screen.getAllByText("Zed (2)")).toHaveLength(2);
    expect(screen.getAllByText("+1 more")).toHaveLength(2);
  });

  it("searches canonical display names while rendering the pure tag slug", () => {
    render(<TagDirectoryClient rows={rows} />);
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search Chronicle tags" }),
      {
        target: { value: "Metal Face" },
      },
    );

    expect(screen.getByText("1 matching tag")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "#doom" })).toHaveLength(2);
    expect(
      screen.queryByRole("link", { name: "#alpha" }),
    ).not.toBeInTheDocument();
  });

  it("sorts alphabetically", () => {
    render(<TagDirectoryClient rows={rows} />);
    fireEvent.change(
      screen.getByRole("combobox", { name: "Sort Chronicle tags" }),
      {
        target: { value: "alphabetical" },
      },
    );

    expect(
      within(desktopRows()[0]).getByRole("link", { name: "#alpha" }),
    ).toBeInTheDocument();
    expect(
      within(desktopRows()[1]).getByRole("link", { name: "#doom" }),
    ).toBeInTheDocument();
  });

  it("distinguishes empty search results from an empty dataset", () => {
    const { rerender } = render(<TagDirectoryClient rows={rows} />);
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search Chronicle tags" }),
      {
        target: { value: "missing" },
      },
    );
    expect(
      screen.getAllByText("No Chronicle tags match this search."),
    ).toHaveLength(2);

    rerender(<TagDirectoryClient rows={[]} />);
    expect(
      screen.getAllByText("No Chronicle tags are available yet."),
    ).toHaveLength(2);
  });
});
