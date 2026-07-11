import type { PersonaReleaseFeed } from "@/lib/persona-release-feeds";

export type AnalyticsGrain = "week";
export type MetricAxis = "primary" | "secondary";

export type AnalyticsPeriod = {
  periodStart: string;
  periodEnd: string;
  shortLabel: string;
  fullLabel: string;
};

export type MetricPoint = {
  periodStart: string;
  metricKey: string;
  value: number;
};

export type MetricDefinition = {
  key: string;
  label: string;
  unit: string;
  color: string;
  axis?: MetricAxis;
  loader: (periods: AnalyticsPeriod[]) => Promise<MetricPoint[]>;
};

export type PersonaActivityConfig = {
  persona: PersonaReleaseFeed;
  title: string;
  description: string;
  metricKeys: readonly string[];
  periods: number;
  grain: AnalyticsGrain;
};

export type SerializableSeries = Omit<MetricDefinition, "loader">;

export type SerializableChartRow = {
  periodStart: string;
  periodEnd: string;
  shortLabel: string;
  fullLabel: string;
  values: Record<string, number>;
};
