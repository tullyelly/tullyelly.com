"use client";

import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import { formatReleaseDate } from "@/components/scrolls/formatReleaseDate";
import { Table, THead, TBody } from "@/components/ui/Table";
import type { ReleaseRow } from "@/lib/scrolls";

type ReleasesTableProps = {
  rows: ReleaseRow[];
  onOpen: (id: string, trigger: HTMLAnchorElement) => void;
};

function getReleaseName(row: ReleaseRow) {
  return row.name || row.label || "";
}

export default function ReleasesTable({ rows, onOpen }: ReleasesTableProps) {
  const onIdClick =
    (scrollId: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.button === 1) {
        return;
      }
      e.preventDefault();
      onOpen(scrollId, e.currentTarget);
    };

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
                <a
                  href={`/mark2/shaolin-scrolls/${r.id}`}
                  onClick={onIdClick(r.id)}
                  aria-label={`Open release ${r.id} details`}
                  className="link-blue"
                  role="button"
                  aria-haspopup="dialog"
                >
                  {r.id}
                </a>
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
