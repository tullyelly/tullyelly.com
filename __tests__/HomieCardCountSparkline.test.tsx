import { render, screen } from "@testing-library/react";
import HomieCardCountSparkline from "@/components/tcdb/HomieCardCountSparkline";

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

describe("HomieCardCountSparkline", () => {
  it("renders no chart when snapshot history is empty", () => {
    render(<HomieCardCountSparkline snapshots={[]} />);

    expect(
      screen.queryByTestId("homie-card-count-sparkline"),
    ).not.toBeInTheDocument();
  });

  it("renders each snapshot as card-count chart data", () => {
    render(
      <HomieCardCountSparkline
        snapshots={[
          {
            homie_id: 34,
            card_count: 450,
            ranking: 2,
            ranking_at: "2026-04-01",
            difference: 4,
          },
          {
            homie_id: 34,
            card_count: 500,
            ranking: 1,
            ranking_at: "2026-05-01",
            difference: 5,
          },
        ]}
      />,
    );

    expect(screen.getByTestId("homie-card-count-sparkline")).toBeInTheDocument();
    const chartData = JSON.parse(
      screen.getByTestId("line-chart").getAttribute("data-points") ?? "[]",
    ) as Array<{ ranking_at: string; card_count: number; ranking: number }>;

    expect(chartData).toHaveLength(2);
    expect(chartData[0]).toMatchObject({
      ranking_at: "2026-04-01",
      card_count: 450,
      ranking: 2,
    });
    expect(chartData[1]).toMatchObject({
      ranking_at: "2026-05-01",
      card_count: 500,
      ranking: 1,
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
