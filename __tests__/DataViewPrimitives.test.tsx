import { render, screen } from "@testing-library/react";

import CollectionDetailPage from "@/components/layout/CollectionDetailPage";
import CollectionDirectoryPage from "@/components/layout/CollectionDirectoryPage";
import DataPageShell from "@/components/layout/DataPageShell";
import SectionHeader from "@/components/layout/SectionHeader";
import DataToolbar, { DataResultCount } from "@/components/ui/DataToolbar";
import {
  MobileDataCard,
  MobileDataEmptyState,
  MobileDataField,
  MobileDataGrid,
} from "@/components/ui/MobileDataCard";
import {
  Table,
  TableCell,
  TableEmptyRow,
  TableHeaderCell,
  TBody,
  THead,
} from "@/components/ui/Table";

describe("data-view primitives", () => {
  it("applies table layout, density, and semantic column intents", () => {
    render(
      <Table layout="fixed" density="compact" showOnMobile>
        <THead>
          <TableHeaderCell intent="name">Name</TableHeaderCell>
          <TableHeaderCell intent="numeric">Count</TableHeaderCell>
        </THead>
        <TBody>
          <tr>
            <TableCell intent="name">Alpha</TableCell>
            <TableCell intent="numeric">12</TableCell>
          </tr>
          <TableEmptyRow colSpan={2}>Nothing else</TableEmptyRow>
        </TBody>
      </Table>,
    );

    const table = screen.getByRole("table");
    expect(table).toHaveClass("table-fixed");
    expect(table.parentElement).toHaveStyle({
      "--table-cell-x": "0.75rem",
      "--table-cell-y": "0.5rem",
    });
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveClass(
      "w-full",
      "min-w-[12rem]",
    );
    expect(screen.getByText("12")).toHaveClass("tabular-nums");
    expect(screen.getByText("Nothing else")).toHaveAttribute("colspan", "2");
  });

  it("groups toolbar controls with one visible live result count", () => {
    render(
      <DataToolbar
        ariaLabel="Directory controls"
        search={
          <label>
            Search
            <input />
          </label>
        }
        filters={<button type="button">Filter</button>}
        result={<DataResultCount>4 results</DataResultCount>}
      />,
    );

    expect(
      screen.getByRole("group", { name: "Directory controls" }),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("4 results");
  });

  it("renders section actions and the standard data-page width", () => {
    const { container } = render(
      <DataPageShell>
        <SectionHeader title="Directory" actions={<button>New</button>} />
      </DataPageShell>,
    );

    expect(screen.getByRole("heading", { name: "Directory" })).toBeVisible();
    expect(screen.getByRole("button", { name: "New" })).toBeVisible();
    expect(container.querySelector("article")).toHaveClass(
      "md:max-w-[var(--content-max)]",
    );
  });

  it("renders themed collection directory and detail skeletons", () => {
    const theme = {
      accent: "#111",
      accentDeep: "#222",
      foreground: "#fff",
      ink: "#111",
      sectionAccent: "#333",
    };
    const { rerender } = render(
      <CollectionDirectoryPage
        heroEyebrow="Collection"
        title="Sets"
        description="Tracked sets"
        stats={[{ label: "Sets", value: 3 }]}
        sectionId="sets"
        sectionTitle="All sets"
        theme={theme}
      >
        <p>Directory content</p>
      </CollectionDirectoryPage>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Sets" }),
    ).toBeVisible();
    expect(screen.getByText("Directory content")).toBeVisible();

    rerender(
      <CollectionDetailPage
        backHref="/sets"
        backLabel="All sets"
        eyebrow="Set"
        title="First set"
        stats={[{ label: "Cards", value: 10 }]}
        sectionId="history"
        sectionTitle="History"
        theme={{
          ...theme,
          link: "#444",
          linkHover: "#555",
          accentSoft: "#eee",
        }}
      >
        <p>Detail content</p>
      </CollectionDetailPage>,
    );
    expect(screen.getByRole("link", { name: /All sets/ })).toHaveAttribute(
      "href",
      "/sets",
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "History" }),
    ).toBeVisible();
  });

  it("provides structural mobile cards and empty states", () => {
    render(
      <ul>
        <MobileDataCard>
          <MobileDataGrid>
            <MobileDataField label="Count">7</MobileDataField>
          </MobileDataGrid>
        </MobileDataCard>
        <MobileDataEmptyState>No matches</MobileDataEmptyState>
      </ul>,
    );

    expect(screen.getByText("Count").tagName).toBe("DT");
    expect(screen.getByText("7").tagName).toBe("DD");
    expect(screen.getByText("No matches").closest("li")).toBeVisible();
  });
});
