import SectionHeader from "@/components/layout/SectionHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrafficChart } from "@/components/analytics/TrafficChart";
import type { OwnerAnalyticsReport } from "@/lib/analytics-archive/report";

const coverageLabels = {
  complete: "Verified",
  zero: "Verified zero",
  unavailable: "Unavailable",
  incomplete: "Incomplete",
  api_failure: "API failed",
  missing: "Unattempted",
};
const countFormatter = new Intl.NumberFormat("en-US");
const formatCount = (value: string) => countFormatter.format(BigInt(value));
export default function AnalyticsReport({
  report,
}: {
  report: OwnerAnalyticsReport;
}) {
  const { range, snapshot, error, maxDay } = report;
  return (
    <section className="space-y-3" aria-labelledby="whole-site-traffic">
      <SectionHeader
        title="Whole-site archived traffic"
        id="whole-site-traffic"
      />
      <p>
        All archived production routes, including routes outside the public
        statistics allowlist. This private report reads the archive; it does not
        collect traffic.
      </p>
      <form
        method="get"
        action="/mark2/admin/analytics"
        className="flex flex-wrap items-end gap-3"
      >
        <div>
          <label htmlFor="traffic-from" className="text-sm font-semibold">
            From (UTC)
          </label>
          <Input
            id="traffic-from"
            name="from"
            type="date"
            defaultValue={range.from}
            max={maxDay}
            required
          />
        </div>
        <div>
          <label htmlFor="traffic-through" className="text-sm font-semibold">
            Through (UTC)
          </label>
          <Input
            id="traffic-through"
            name="through"
            type="date"
            defaultValue={range.through}
            max={maxDay}
            required
          />
        </div>
        <Button type="submit">View traffic</Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Inclusive completed UTC days; up to 366 days per report. Daily visitors
        are not distinct visitors across a period.
      </p>
      {error ? (
        <p role="alert">{error}</p>
      ) : snapshot ? (
        <>
          {snapshot.verified > 0 ? (
            <p className="text-xl font-semibold">
              {formatCount(snapshot.total)} archived whole-site pageviews
            </p>
          ) : (
            <p role="status">
              No verified traffic is available for this period; missing days are
              not zero traffic.
            </p>
          )}
          <p>
            Coverage: {range.from} through {range.through} UTC;{" "}
            {snapshot.verified} of {snapshot.expected} days verified;{" "}
            {snapshot.expected - snapshot.verified} gaps.
          </p>
          <p>
            {snapshot.unavailable} unavailable; {snapshot.incomplete}{" "}
            incomplete; {snapshot.failures} API-failed; {snapshot.missing}{" "}
            unattempted days.
          </p>
          <p>
            Last archive update in this period:{" "}
            {snapshot.updated ?? "None verified"} (UTC). Daily collection
            freshness is shown below.
          </p>
          <TrafficChart
            scope="sitewide"
            rows={snapshot.trend.map(({ day, views }) => ({ day, views }))}
          />
          <details>
            <summary>Daily values</summary>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Whole-site daily archive values and coverage
                </caption>
                <thead>
                  <tr>
                    <th scope="col">UTC day</th>
                    <th scope="col">Coverage</th>
                    <th scope="col">Pageviews</th>
                    <th scope="col">Daily visitors</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.trend.map((row) => (
                    <tr key={row.day}>
                      <th scope="row">{row.day}</th>
                      <td>{coverageLabels[row.status]}</td>
                      <td>
                        {row.views === null
                          ? "Unverified"
                          : formatCount(row.views)}
                      </td>
                      <td>
                        {row.visitors === null
                          ? "Unverified"
                          : formatCount(row.visitors)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <h3 className="text-lg font-semibold">Most-viewed archived paths</h3>
          <p>
            Showing {snapshot.pages.length} of {snapshot.pathCount} paths; at
            most 50. Rankings include only verified days. The sitewide total
            includes every verified route, not just these rankings.
          </p>
          {snapshot.pages.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Top archived paths in selected period
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Exact path</th>
                    <th scope="col">Pageviews</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.pages.map((row) => (
                    <tr key={row.path}>
                      <th
                        scope="row"
                        className="break-all text-left font-normal"
                      >
                        {row.path}
                      </th>
                      <td>{formatCount(row.views)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>
              No per-page values are available for verified days in this period.
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}
