import { render, screen } from "@testing-library/react";
import { TcdbCardTrafficChartClient } from "@/components/chronicles/TcdbCardTrafficChartClient";
import type { TcdbCardTrafficDay } from "@/lib/tcdb-card-traffic";

jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({
    children,
    data,
  }: {
    children: React.ReactNode;
    data: TcdbCardTrafficDay[];
  }) => (
    <div data-testid="line-chart" data-points={JSON.stringify(data)}>
      {children}
    </div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ReferenceLine: ({ x }: { x: string }) => (
    <div data-testid="reference-line" data-x={x} />
  ),
  Legend: () => <div data-testid="legend" />,
  Line: ({ dataKey, name }: { dataKey: string; name: string }) => (
    <div data-testid="line-series" data-key={dataKey} data-name={name} />
  ),
}));

const rows: TcdbCardTrafficDay[] = Array.from({ length: 10 }, (_, index) => {
  const day = String(20 + index).padStart(2, "0");

  return {
    date: `2026-06-${day}`,
    slot: index + 1,
    sent: 0,
    received: 0,
    sentTradeCount: 0,
    receivedTradeCount: 0,
    isChronicleDate: index === 5,
  };
});

describe("TcdbCardTrafficChartClient", () => {
  it("renders an empty state with all 10 zero dates", () => {
    render(<TcdbCardTrafficChartClient rows={rows} />);

    expect(
      screen.getByText("No TCDb card traffic in this 10-day window."),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(10);
  });

  it("renders a line chart with the provided 10-day traffic rows", () => {
    const trafficRows = rows.map((row) =>
      row.date === "2026-06-24"
        ? {
            ...row,
            sent: 9,
            received: 6,
            sentTradeCount: 2,
            receivedTradeCount: 1,
          }
        : row,
    );

    render(<TcdbCardTrafficChartClient rows={trafficRows} />);

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    const chartData = JSON.parse(
      screen.getByTestId("line-chart").getAttribute("data-points") ?? "[]",
    ) as Array<
      TcdbCardTrafficDay & { axisLabel: string; fullDateLabel: string }
    >;
    expect(chartData).toHaveLength(10);
    expect(chartData[0]?.axisLabel).toBe("Jun 20");
    expect(chartData[4]).toMatchObject({
      date: "2026-06-24",
      sent: 9,
      received: 6,
      sentTradeCount: 2,
      receivedTradeCount: 1,
    });
    expect(screen.getByTestId("reference-line")).toHaveAttribute(
      "data-x",
      "2026-06-25",
    );
    expect(screen.getAllByTestId("line-series")).toHaveLength(2);
    expect(screen.getByTestId("legend")).toBeInTheDocument();
  });
});
