"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { X } from "lucide-react";
import TrendPill from "./TrendPill";
import { Table, TBody, THead } from "@/components/ui/Table";
import TablePager from "@/components/ui/TablePager";
import { Card } from "@ui";
import { BusyButton } from "@/components/ui/busy-button";
import TCDBRankingRowClient from "@/components/tcdb/TCDBRankingRowClient";
import Modal, {
  ModalClose,
  ModalDescription,
  ModalTitle,
} from "@/components/ui/Modal";
import type { RankingResponse } from "@/lib/data/tcdb";
import { fmtDate } from "@/lib/datetime";

type Row = RankingResponse["data"][number];

const integerFormatter = new Intl.NumberFormat("en-US");
const signedFormatter = new Intl.NumberFormat("en-US", {
  signDisplay: "always",
});

function formatSigned(value: number | null | undefined) {
  if (value === null || value === undefined) return "Not available";
  return signedFormatter.format(value);
}

function formatRankingTimestamp(value: string | null | undefined) {
  return fmtDate(value);
}

const dialogFields: ReadonlyArray<{
  label: string;
  render: (row: Row) => ReactNode;
}> = [
  {
    label: "Current Rank",
    render: (row) => integerFormatter.format(row.ranking),
  },
  {
    label: "Total Cards",
    render: (row) => integerFormatter.format(row.card_count),
  },
  { label: "Jersey", render: (row) => row.homie_id },
  {
    label: "Difference",
    render: (row) => signedFormatter.format(row.difference),
  },
  {
    label: "Rank Delta",
    render: (row) => formatSigned(row.rank_delta),
  },
  {
    label: "Difference Delta",
    render: (row) => formatSigned(row.diff_delta),
  },
  {
    label: "Ranking Updated",
    render: (row) => formatRankingTimestamp(row.ranking_at),
  },
  {
    label: "Overall Trend",
    render: (row) => <TrendPill trend={row.trend_overall} />,
  },
  {
    label: "Rank Trend",
    render: (row) => <TrendPill trend={row.trend_rank} />,
  },
  {
    label: "Diff Sign Changed",
    render: (row) => (row.diff_sign_changed ? "Yes" : "No"),
  },
];

export type TCDBRankingTableClientProps = {
  serverData: RankingResponse;
};

export default function TCDBRankingTableClient({
  serverData,
}: TCDBRankingTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname ?? "/cardattack/tcdb-rankings";
  const search = useSearchParams();
  const searchSnapshot = search?.toString() ?? "";
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState<string>(() => search?.get("q") ?? "");
  const [trend, setTrend] = useState<string>(() => search?.get("trend") ?? "");

  useEffect(() => {
    setQ(search?.get("q") ?? "");
    setTrend(search?.get("trend") ?? "");
  }, [searchSnapshot, search]);

  const rows = useMemo(
    () => [...serverData.data].sort((a, b) => b.card_count - a.card_count),
    [serverData.data],
  );

  const [detailRow, setDetailRow] = useState<Row | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  const updateQuery = useCallback(
    (
      next: Record<string, string | undefined>,
      options: { resetPage?: boolean } = {},
    ) => {
      const { resetPage = false } = options;
      const current = new URLSearchParams(searchSnapshot);
      Object.entries(next).forEach(([key, value]) => {
        if (!value) current.delete(key);
        else current.set(key, value);
      });
      if (resetPage) {
        current.delete("page");
      }
      const queryString = current.toString();
      startTransition(() => {
        const nextPath = queryString
          ? `${currentPath}?${queryString}`
          : currentPath;
        router.replace(nextPath as Route);
      });
    },
    [currentPath, router, searchSnapshot],
  );

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      updateQuery({ q: q || undefined }, { resetPage: true });
    },
    [q, updateQuery],
  );

  const onTrendChange = useCallback(
    (value: string) => {
      setTrend(value);
      updateQuery({ trend: value || undefined }, { resetPage: true });
    },
    [updateQuery],
  );

  const handleOpenDetail = useCallback(
    (row: Row, trigger: HTMLButtonElement) => {
      setDetailRow(row);
      lastTriggerRef.current = trigger;
    },
    [],
  );

  const handleCloseDetail = useCallback(() => {
    setDetailRow(null);
  }, []);

  useEffect(() => {
    if (detailRow) return;
    const trigger = lastTriggerRef.current;
    if (!trigger) return;
    const frame = requestAnimationFrame(() => {
      trigger.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [detailRow]);

  const hasRows = rows.length > 0;
  const { meta } = serverData;

  return (
    <>
      <section
        className="space-y-4"
        aria-live="polite"
        aria-busy={isPending ? "true" : undefined}
        role="region"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <form
            onSubmit={onSubmit}
            className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center"
            role="search"
            aria-label="TCDB rankings search"
          >
            <div className="flex w-full items-center gap-2">
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Search homies"
                className="form-input h-9 w-full md:w-64"
                aria-label="Search homies"
                type="search"
              />
              <BusyButton
                type="submit"
                className="btn shrink-0"
                isLoading={isPending}
                loadingLabel="Searching…"
              >
                Search
              </BusyButton>
            </div>
            <div aria-live="polite" className="sr-only">
              {isPending ? "Updating results" : "Results ready"}
            </div>
          </form>
          <div className="md:min-w-[12rem]">
            <select
              value={trend}
              onChange={(event) => onTrendChange(event.target.value)}
              className="form-input h-9 w-full"
              aria-label="Filter by trend"
            >
              <option value="">All trends</option>
              <option value="up">Up</option>
              <option value="down">Down</option>
              <option value="flat">Flat</option>
            </select>
          </div>
        </div>

        <ul className="space-y-3 md:hidden">
          {hasRows ? (
            rows.map((row) => (
              <Card as="li" key={`mobile-${row.homie_id}`} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-ink">{row.name}</p>
                    <p className="text-xs text-ink/70">
                      Rank {integerFormatter.format(row.ranking)}
                      {row.ranking === 1 ? (
                        <span className="ml-1" role="img" aria-label="Top rank">
                          🏆
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <TrendPill trend={row.trend_overall} />
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink/60">
                      Jersey
                    </dt>
                    <dd className="tabular-nums text-ink">{row.homie_id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink/60">
                      Cards
                    </dt>
                    <dd className="tabular-nums text-ink">
                      {integerFormatter.format(row.card_count)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink/60">
                      Difference
                    </dt>
                    <dd className="tabular-nums text-ink">
                      {signedFormatter.format(row.difference)}
                    </dd>
                  </div>
                </dl>
                <TCDBRankingRowClient
                  id={row.homie_id}
                  name={row.name}
                  className="mt-3 text-sm"
                  onOpen={(_, el) => handleOpenDetail(row, el)}
                />
              </Card>
            ))
          ) : (
            <Card as="li" className="p-3 text-sm text-ink/70">
              No rankings match your filters.
            </Card>
          )}
        </ul>

        <Table
          variant="bucks"
          aria-label="TCDB rankings table"
          data-testid="tcdb-rankings-table"
          className="thead-sticky"
        >
          <THead variant="bucks">
            <th scope="col" className="w-[120px]">
              Jersey
            </th>
            <th scope="col">Name</th>
            <th scope="col" className="w-[140px]">
              Cards
            </th>
            <th scope="col" className="w-[72px]">
              Rank
            </th>
            <th scope="col" className="w-[160px]">
              Trend
            </th>
          </THead>
          <TBody>
            {hasRows ? (
              rows.map((row) => (
                <tr
                  key={row.homie_id}
                  data-testid="tcdb-table-row"
                  className="border-b border-black/5 last:border-0"
                >
                  <td className="tabular-nums text-ink/80">
                    <TCDBRankingRowClient
                      id={row.homie_id}
                      name={row.name}
                      onOpen={(_, el) => handleOpenDetail(row, el)}
                    >
                      {row.homie_id}
                    </TCDBRankingRowClient>
                  </td>
                  <td className="truncate text-ink">
                    <span className="block" title={row.name}>
                      {row.name}
                    </span>
                  </td>
                  <td className="tabular-nums text-ink">
                    {integerFormatter.format(row.card_count)}
                  </td>
                  <td className="tabular-nums text-ink/80">
                    <span className="inline-flex items-center gap-1">
                      {integerFormatter.format(row.ranking)}
                      {row.ranking === 1 ? (
                        <span
                          className="leading-none"
                          role="img"
                          aria-label="Top rank"
                        >
                          🏆
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td>
                    <TrendPill trend={row.trend_overall} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-ink/70"
                >
                  No rankings match your filters.
                </td>
              </tr>
            )}
          </TBody>
        </Table>

        <TablePager
          page={meta.page}
          pageSize={meta.pageSize}
          total={meta.total}
          isPending={isPending}
          onPageChange={(nextPage) => updateQuery({ page: String(nextPage) })}
          onPageSizeChange={(nextSize) =>
            updateQuery({ pageSize: String(nextSize) }, { resetPage: true })
          }
        />
      </section>

      {detailRow ? (
        <Modal
          open
          onClose={handleCloseDetail}
          className="w-[min(80vw,640px)] max-w-[640px] sm:w-[min(80vw,640px)] overflow-x-hidden box-border"
        >
          <div
            className="flex min-h-0 w-full flex-1 flex-col"
            data-modal-width-ratio={
              process.env.E2E === "1" ? "0.40" : undefined
            }
          >
            <div
              data-dialog-handle
              className="sticky top-0 z-[1] flex items-center justify-between gap-3 rounded-t-2xl bg-[var(--blue)] px-5 py-3 text-white"
            >
              <div className="min-w-0 flex-1">
                <ModalTitle className="truncate text-base font-semibold leading-6">
                  {detailRow.name}; Jersey {detailRow.homie_id}
                </ModalTitle>
              </div>
              <ModalClose asChild>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--blue)]"
                  aria-label="Close dialog"
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <X className="h-4 w-4" />
                </button>
              </ModalClose>
            </div>
            <div className="modal-body grow" data-testid="modal-body">
              <ModalDescription className="sr-only">
                Detailed TCDB ranking information for {detailRow.name}.
              </ModalDescription>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:[grid-template-columns:repeat(2,minmax(0,1fr))]">
                {dialogFields.map(({ label, render }) => (
                  <div
                    key={label}
                    className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-white p-4 shadow-sm"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-ink/60">
                      {label}
                    </div>
                    <div className="mt-1 min-w-0 text-sm text-ink">
                      {render(detailRow)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
