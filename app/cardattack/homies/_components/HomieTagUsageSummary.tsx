import Link from "next/link";
import type { Route } from "next";
import { Card } from "@ui";
import SectionHeader from "@/components/layout/SectionHeader";
import {
  Table,
  TableCell,
  TableHeaderCell,
  TBody,
  THead,
} from "@/components/ui/Table";
import type { HomieTagUsageDatum } from "./HomieTagUsageChart";
import HomieTagUsageChart from "./HomieTagUsageChart";

export default function HomieTagUsageSummary({
  rows,
}: {
  rows: HomieTagUsageDatum[];
}) {
  return (
    <section aria-labelledby="homie-tag-usage-title" className="space-y-4">
      <SectionHeader
        id="homie-tag-usage-title"
        title="Top Chronicle homie tags"
        description="Published MDX mentions matched to the homie directory."
      />

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <Card as="div" className="min-w-0 p-4 md:p-5 lg:h-full">
          <h3 className="!m-0 text-lg font-bold text-ink">Mentions by tag</h3>
          <div className="mt-3">
            <HomieTagUsageChart rows={rows} />
          </div>
        </Card>

        <Card as="div" className="min-w-0 overflow-hidden p-0 lg:h-full">
          {rows.length > 0 ? (
            <Table
              showOnMobile
              density="compact"
              variant="bucks"
              aria-label="Chronicle homie tag usage"
              frameClassName="rounded-none border-0 shadow-none"
            >
              <THead variant="bucks">
                <TableHeaderCell intent="identifier">Tag</TableHeaderCell>
                <TableHeaderCell intent="grow">Homie</TableHeaderCell>
                <TableHeaderCell intent="numeric">Mentions</TableHeaderCell>
                <TableHeaderCell intent="numeric">Chronicles</TableHeaderCell>
              </THead>
              <TBody>
                {rows.map((row) => (
                  <tr key={row.tag}>
                    <TableCell intent="identifier" className="font-bold">
                      <Link href={row.href as Route} className="link-blue">
                        #{row.tag}
                      </Link>
                    </TableCell>
                    <TableCell intent="grow">{row.name}</TableCell>
                    <TableCell intent="numeric">{row.count}</TableCell>
                    <TableCell intent="numeric">{row.chronicleCount}</TableCell>
                  </tr>
                ))}
              </TBody>
            </Table>
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
