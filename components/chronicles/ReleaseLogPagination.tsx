import Link from "next/link";

import { fmtDate } from "@/lib/datetime";
import type { ReleasePageResult } from "@/lib/alter-ego-release-content";
import {
  getPersonaReleaseLogHref,
  type PersonaReleaseFeed,
  type PersonaReleaseOrder,
} from "@/lib/persona-release-feeds";

type Props = Pick<ReleasePageResult, "page" | "pageCount"> & {
  persona: PersonaReleaseFeed;
  order: PersonaReleaseOrder;
  dateRange: { start: string; end: string } | null;
  position: "top" | "bottom";
};

export function ReleaseLogPagination({
  persona,
  order,
  page,
  pageCount,
  dateRange,
  position,
}: Props) {
  return (
    <nav
      aria-label={`${position === "top" ? "Top" : "Bottom"} release log pagination`}
      className="rounded-xl border border-border bg-muted/20 px-3 py-3 md:px-4"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="justify-self-start">
          {page > 1 ? (
            <Link
              className="link-blue"
              href={getPersonaReleaseLogHref(persona, page - 1, order)}
              rel="prev"
            >
              ← Previous
            </Link>
          ) : null}
        </div>
        <span className="text-center text-sm font-medium text-ink">
          Page {page} of {pageCount}
        </span>
        <div className="justify-self-end">
          {page < pageCount ? (
            <Link
              className="link-blue"
              href={getPersonaReleaseLogHref(persona, page + 1, order)}
              rel="next"
            >
              Next →
            </Link>
          ) : null}
        </div>
      </div>
      {dateRange ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Entries dated {fmtDate(dateRange.start)} to {fmtDate(dateRange.end)}
        </p>
      ) : null}
    </nav>
  );
}
