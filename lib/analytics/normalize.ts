import type { AnalyticsPeriod, MetricPoint, SerializableChartRow } from "@/lib/analytics/types";

export function zeroFillMetric(periods: AnalyticsPeriod[], metricKey: string, points: MetricPoint[]): MetricPoint[] {
  const values = new Map(points.filter((point) => point.metricKey === metricKey).map((point) => [point.periodStart, point.value]));
  return periods.map((period) => ({ periodStart: period.periodStart, metricKey, value: values.get(period.periodStart) ?? 0 }));
}

export function toWideChartRows(periods: AnalyticsPeriod[], series: MetricPoint[][]): SerializableChartRow[] {
  const byPeriod = new Map<string, Record<string, number>>();
  for (const points of series) for (const point of points) (byPeriod.get(point.periodStart) ?? byPeriod.set(point.periodStart, {}).get(point.periodStart)!)[point.metricKey] = point.value;
  return periods.map((period) => ({ ...period, values: byPeriod.get(period.periodStart) ?? {} }));
}
