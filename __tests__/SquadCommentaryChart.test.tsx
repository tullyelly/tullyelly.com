import { render, screen } from "@testing-library/react";
import SquadCommentaryChart from "@/app/unclejimmy/squad/_components/SquadCommentaryChart";

jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({
    children,
    data,
  }: {
    children: React.ReactNode;
    data: Array<{ tag_name: string; comment_count: number }>;
  }) => (
    <div data-testid="bar-chart" data-points={JSON.stringify(data)}>
      {children}
    </div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Bar: () => <div data-testid="bar-series" />,
}));

describe("SquadCommentaryChart", () => {
  it("renders an empty-state message when there is no data", () => {
    render(<SquadCommentaryChart rows={[]} />);

    expect(
      screen.getByText("No commentary has been logged yet."),
    ).toBeInTheDocument();
  });

  it("renders the chart with the provided commentary rows", () => {
    render(
      <SquadCommentaryChart
        rows={[
          { tag_name: "cipher", comment_count: 4 },
          { tag_name: "lulu", comment_count: 2 },
        ]}
      />,
    );

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toHaveAttribute(
      "data-points",
      JSON.stringify([
        { tag_name: "cipher", comment_count: 4 },
        { tag_name: "lulu", comment_count: 2 },
      ]),
    );
  });
});
