import { fireEvent, render, screen } from "@testing-library/react";
import ChronicleListClient, {
  type ChronicleListRow,
} from "@/app/shaolin/_components/ChronicleListClient";
import { ALTER_EGO_OPTIONS } from "@/lib/alterEgo";

const rows: ChronicleListRow[] = Array.from({ length: 12 }, (_, index) => ({
  slug: `chronicle-${index + 1}`,
  url: `/shaolin/chronicle-${index + 1}`,
  title: `Chronicle ${index + 1}`,
  summary: index === 4 ? "A uniquely searchable summary" : "Archive entry",
  date: `2026-08-${String(index + 1).padStart(2, "0")}`,
  alterEgo: index % 2 === 0 ? "mark2" : "cardattack",
  tags:
    index === 4
      ? ["first", "second", "third", "hidden-search-tag"]
      : [index % 2 === 0 ? "builds" : "cards"],
  infinityStone: index === 4,
}));

function renderList(initialAlterEgo: "" | "mark2" | "cardattack" = "") {
  return render(
    <ChronicleListClient
      rows={rows}
      alterEgos={ALTER_EGO_OPTIONS}
      initialAlterEgo={initialAlterEgo}
    />,
  );
}

describe("ChronicleListClient", () => {
  it("uses the initial alter ego filter and can clear it", () => {
    renderList("cardattack");

    expect(screen.getByText("6 matching chronicles")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("12 matching chronicles")).toBeInTheDocument();
  });

  it("searches all row data, including tags hidden by the visual tag limit", () => {
    renderList();

    expect(
      screen.queryByRole("combobox", { name: "Filter chronicles by tag" }),
    ).not.toBeInTheDocument();
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search chronicles" }),
      {
        target: { value: "hidden-search-tag" },
      },
    );

    expect(screen.getByText("1 matching chronicle")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Chronicle 5" })).toHaveLength(
      2,
    );
  });

  it("paginates and resets to page one when a filter changes", () => {
    renderList();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Page 2 of 2 • 12 total")).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("combobox", { name: "Filter chronicles by alter ego" }),
      { target: { value: "mark2" } },
    );

    expect(screen.getByText("Page 1 of 1 • 6 total")).toBeInTheDocument();
  });
});
