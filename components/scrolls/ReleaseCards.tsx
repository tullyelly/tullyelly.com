"use client";

import Link from "next/link";
import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import { formatReleaseDate } from "@/components/scrolls/formatReleaseDate";
import type { ReleaseRow } from "@/lib/scrolls";
import { Card } from "@ui";

type ReleaseCardsProps = {
  rows: ReleaseRow[];
};

export default function ReleaseCards({ rows }: ReleaseCardsProps) {
  return (
    <ul className="space-y-3" data-testid="scrolls-cards">
      {rows.map((r) => (
        <Card as="li" key={r.id} data-testid="release-card" className="p-3">
          <div className="flex items-center justify-between">
            <Link
              href={`/mark2/shaolin-scrolls/${r.id}`}
              aria-label={`View release ${r.id} details`}
              className="font-semibold link-blue"
            >
              #{r.id}
            </Link>
            <span className="text-xs opacity-80">
              {formatReleaseDate(r.release_date)}
            </span>
          </div>
          <div className="mt-1">{(r.label ?? r.name) || ""}</div>
          <div className="mt-2 flex gap-2 text-xs">
            <Badge className={getBadgeClass(r.status as any)}>{r.status}</Badge>
            <Badge className={getBadgeClass(r.type as any)}>{r.type}</Badge>
          </div>
        </Card>
      ))}
    </ul>
  );
}
