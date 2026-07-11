import { render, screen } from "@testing-library/react";
import { PersonaActivityChartClient } from "@/components/analytics/PersonaActivityChartClient";

jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => <div data-testid="tooltip" />,
  Line: ({ dataKey, name, unit }: { dataKey: string; name: string; unit: string }) => <div data-testid="line" data-key={dataKey} data-name={name} data-unit={unit} />,
}));

const rows = Array.from({ length: 10 }, (_, index) => ({ periodStart: `2026-0${index + 1}-01`, periodEnd: `2026-0${index + 1}-07`, shortLabel: `Week ${index + 1}`, fullLabel: `Week ${index + 1}`, values: { posts: index === 9 ? 1 : 0 } }));
const primary = { key: "posts", label: "cardattack posts", unit: "posts", color: "#00471B", axis: "primary" as const };

describe("PersonaActivityChartClient", () => {
  it("renders one line for a single-metric persona", () => {
    render(<PersonaActivityChartClient rows={rows} series={primary} label="activity" />);
    expect(screen.getAllByTestId("line")).toHaveLength(1);
    expect(screen.getByTestId("line")).toHaveAttribute("data-unit", "posts");
  });
});
