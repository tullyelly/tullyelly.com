"use client";

import Link from "next/link";

import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import { formatReleaseDate } from "@/components/scrolls/formatReleaseDate";
import { Table, THead, TBody } from "@/components/ui/Table";
import type { ReleaseRow } from "@/lib/scrolls";

type ReleasesTableProps = {
  rows: ReleaseRow[];
};

function getReleaseName(row: ReleaseRow) {
  return row.name || row.label || "";
}

export default function ReleasesTable({ rows }: ReleasesTableProps) {
  return (
    <Table
      variant="bucks"
      id="scrolls-table"
      aria-label="Shaolin scrolls table"
      data-testid="scrolls-table"
      aria-rowcount={rows.length}
      className="thead-sticky"
    >
      <THead variant="bucks">
        <th scope="col" className="w-[64px] whitespace-nowrap">
          ID
        </th>
        <th scope="col">Release Name</th>
        <th scope="col" className="w-[112px] whitespace-nowrap">
          Status
        </th>
        <th scope="col" className="w-[104px] whitespace-nowrap">
          Type
        </th>
        <th scope="col" className="w-[148px] whitespace-nowrap">
          Release Date
        </th>
      </THead>
      <TBody>
        {rows.map((r) => {
          const releaseDateIso = r.release_date ?? undefined;
          return (
            <tr key={r.id} className="border-b border-black/5 last:border-0">
              <td className="tabular-nums text-ink/80">
                <Link
                  href={`/mark2/shaolin-scrolls/${r.id}`}
                  aria-label={`View release ${r.id} details`}
                  className="link-blue"
                >
                  {r.id}
                </Link>
              </td>
              <td className="whitespace-normal break-words">
                <span className="block" title={getReleaseName(r)}>
                  {getReleaseName(r)}
                </span>
              </td>
              <td className="whitespace-nowrap">
                <Badge className={getBadgeClass(r.status as any)}>
                  {r.status}
                </Badge>
              </td>
              <td className="whitespace-nowrap">
                <Badge className={getBadgeClass(r.type as any)}>{r.type}</Badge>
              </td>
              <td
                className="whitespace-nowrap"
                data-testid="release-date"
                data-release-iso={releaseDateIso}
              >
                {formatReleaseDate(r.release_date)}
              </td>
            </tr>
          );
        })}
      </TBody>
    </Table>
  );
}
