import { render, screen } from "@testing-library/react";
import ClanCardCountSparkline from "@/components/tcdb/ClanCardCountSparkline";

jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({
    children,
    data,
  }: {
    children: React.ReactNode;
    data: unknown[];
  }) => (
    <div data-testid="line-chart" data-points={JSON.stringify(data)}>
      {children}
    </div>
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: ({ dataKey }: { dataKey: string }) => (
    <div data-testid="y-axis" data-key={dataKey} />
  ),
  Tooltip: () => <div data-testid="tooltip" />,
  Line: ({ dataKey }: { dataKey: string }) => (
    <div data-testid="line-series" data-key={dataKey} />
  ),
}));

describe("ClanCardCountSparkline", () => {
  it("renders no chart when snapshot history is empty", () => {
    render(<ClanCardCountSparkline snapshots={[]} />);

    expect(
      screen.queryByTestId("clan-card-count-sparkline"),
    ).not.toBeInTheDocument();
  });

  it("renders each snapshot date as total card-count chart data", () => {
    render(
      <ClanCardCountSparkline
        snapshots={[
          {
            clan_id: 12,
            sport: "basketball",
            card_count: 600,
            ranking: 2,
            ranking_at: "2026-04-01",
            difference: 4,
          },
          {
            clan_id: 12,
            sport: "basketball",
            card_count: 650,
            ranking: 1,
            ranking_at: "2026-05-01",
            difference: 8,
          },
        ]}
      />,
    );

    expect(screen.getByTestId("clan-card-count-sparkline")).toBeInTheDocument();
    const chartData = JSON.parse(
      screen.getByTestId("line-chart").getAttribute("data-points") ?? "[]",
    ) as Array<{
      ranking_at: string;
      card_count: number;
      ranking: number;
      sport: string;
    }>;

    expect(chartData).toHaveLength(2);
    expect(chartData[0]).toMatchObject({
      ranking_at: "2026-04-01",
      card_count: 600,
      ranking: 2,
      sport: "basketball",
    });
    expect(chartData[1]).toMatchObject({
      ranking_at: "2026-05-01",
      card_count: 650,
      ranking: 1,
      sport: "basketball",
    });
    expect(screen.getByTestId("y-axis")).toHaveAttribute(
      "data-key",
      "card_count",
    );
    expect(screen.getByTestId("line-series")).toHaveAttribute(
      "data-key",
      "card_count",
    );
  });
});
