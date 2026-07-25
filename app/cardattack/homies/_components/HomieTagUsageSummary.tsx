import Link from "next/link";
import type { Route } from "next";
import { Card } from "@ui";
import type { HomieTagUsageDatum } from "./HomieTagUsageChart";
import HomieTagUsageChart from "./HomieTagUsageChart";

export default function HomieTagUsageSummary({
  rows,
}: {
  rows: HomieTagUsageDatum[];
}) {
  return (
    <section aria-labelledby="homie-tag-usage-title" className="space-y-4">
      <div>
        <h2
          id="homie-tag-usage-title"
          className="!m-0 text-2xl font-bold text-ink"
        >
          Top Chronicle homie tags
        </h2>
        <p className="!m-0 mt-1 text-sm text-muted-foreground">
          Published MDX mentions matched to the homie directory.
        </p>
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <Card as="div" className="min-w-0 p-4 md:p-5 lg:h-full">
          <h3 className="!m-0 text-lg font-bold text-ink">Mentions by tag</h3>
          <div className="mt-3">
            <HomieTagUsageChart rows={rows} />
          </div>
        </Card>

        <Card as="div" className="min-w-0 overflow-hidden p-0 lg:h-full">
          {rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-[var(--green)] text-left text-white">
                  <tr>
                    <th className="px-4 py-3">Tag</th>
                    <th className="px-4 py-3">Homie</th>
                    <th className="px-4 py-3 text-right">Mentions</th>
                    <th className="px-4 py-3 text-right">Chronicles</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.tag}
                      className="border-b border-ink/10 last:border-0 odd:bg-white even:bg-[var(--cream)]"
                    >
                      <td className="px-4 py-3 font-bold">
                        <Link href={row.href as Route} className="link-blue">
                          #{row.tag}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{row.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {row.count}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {row.chronicleCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="!m-0 p-5 text-sm text-muted-foreground">
              No homie tag usage is available yet.
            </p>
          )}
        </Card>
      </div>
    </section>
  );
}
