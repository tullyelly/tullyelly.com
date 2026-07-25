import { render, screen } from "@testing-library/react";
import HomieTagUsageSummary from "@/app/cardattack/homies/_components/HomieTagUsageSummary";

jest.mock("@/app/cardattack/homies/_components/HomieTagUsageChart", () => ({
  __esModule: true,
  default: ({ rows }: { rows: unknown[] }) => (
    <div data-testid="homie-tag-usage-chart">{rows.length} rows</div>
  ),
}));

describe("HomieTagUsageSummary", () => {
  it("renders a responsive chart and linked key table", () => {
    const { container } = render(
      <HomieTagUsageSummary
        rows={[
          {
            tag: "freak",
            name: "Giannis Antetokounmpo",
            count: 12,
            chronicleCount: 7,
            href: "/cardattack/homies/freak",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("homie-tag-usage-chart")).toHaveTextContent(
      "1 rows",
    );
    expect(screen.getByRole("link", { name: "#freak" })).toHaveAttribute(
      "href",
      "/cardattack/homies/freak",
    );
    expect(screen.getByText("Giannis Antetokounmpo")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Tag key" }),
    ).not.toBeInTheDocument();
    expect(container.querySelector(".lg\\:grid-cols-2")).toBeInTheDocument();
    expect(container.querySelector(".items-stretch")).toBeInTheDocument();
    expect(container.querySelectorAll(".lg\\:h-full")).toHaveLength(2);
  });
});
