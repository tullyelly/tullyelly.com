"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as Dialog from "@ui/dialog";
import { X } from "lucide-react";
import { fmtDate } from "@/lib/datetime";
import TrendPill, { TrendValue } from "./TrendPill";
import { Table, TBody, THead } from "@/components/ui/Table";
import TablePager from "@/components/ui/TablePager";
import { Card } from "@ui";
import { BusyButton } from "@/components/ui/busy-button";

type Row = {
  homie_id: number;
  name: string;
  card_count: number;
  ranking: number;
  ranking_at: string;
  difference: number;
  rank_delta: number | null;
  diff_delta: number | null;
  trend_rank: TrendValue;
  trend_overall: TrendValue;
  diff_sign_changed: boolean;
};

type ApiPayload = {
  data: Row[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    q?: string;
    trend?: string;
  };
};

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

type RankingDetailDialogProps = {
  row: Row;
  trigger: ReactNode;
};

function RankingDetailDialog({ row, trigger }: RankingDetailDialogProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="app-dialog-overlay" />
        <Dialog.Content className="app-dialog-content outline-none">
          <div
            data-dialog-handle
            className="-mx-6 -mt-6 flex items-center gap-3 bg-[var(--blue)] px-6 py-2 text-white"
            style={{
              borderTopLeftRadius: "13px",
              borderTopRightRadius: "13px",
            }}
          >
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-base font-semibold leading-6">
                {row.name}; Jersey {row.homie_id}
              </Dialog.Title>
            </div>
            <div className="flex items-center gap-2">
              <Dialog.Close
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/80 text-white transition hover:opacity-80"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
          </div>
          <Dialog.Description className="sr-only">
            Detailed TCDB ranking information for {row.name}.
          </Dialog.Description>
          <div className="mt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Current Rank",
                  render: () => integerFormatter.format(row.ranking),
                },
                {
                  label: "Total Cards",
                  render: () => integerFormatter.format(row.card_count),
                },
                { label: "Jersey", render: () => row.homie_id },
                {
                  label: "Difference",
                  render: () => signedFormatter.format(row.difference),
                },
                {
                  label: "Rank Delta",
                  render: () => formatSigned(row.rank_delta),
                },
                {
                  label: "Difference Delta",
                  render: () => formatSigned(row.diff_delta),
                },
                {
                  label: "Ranking Updated",
                  render: () => formatRankingTimestamp(row.ranking_at),
                },
                {
                  label: "Overall Trend",
                  render: () => <TrendPill trend={row.trend_overall} />,
                },
                {
                  label: "Rank Trend",
                  render: () => <TrendPill trend={row.trend_rank} />,
                },
                {
                  label: "Diff Sign Changed",
                  render: () => (row.diff_sign_changed ? "Yes" : "No"),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-white p-4 shadow-sm"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-ink/60">
                    {item.label}
                  </div>
                  <div className="mt-1 text-sm text-ink">{item.render()}</div>
                </div>
              ))}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function TCDBRankingTable({
  serverData,
}: {
  serverData: ApiPayload;
}) {
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

  const { data, meta } = serverData;
  const rows = useMemo(
    () => [...data].sort((a, b) => b.card_count - a.card_count),
    [data],
  );

  function updateQuery(
    next: Record<string, string | undefined>,
    options: { resetPage?: boolean } = {},
  ) {
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
      router.replace(
        queryString ? `${currentPath}?${queryString}` : currentPath,
      );
    });
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateQuery({ q: q || undefined }, { resetPage: true });
  };

  const onTrendChange = (value: string) => {
    setTrend(value);
    updateQuery({ trend: value || undefined }, { resetPage: true });
  };

  const hasRows = rows.length > 0;

  return (
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
              <RankingDetailDialog
                row={row}
                trigger={
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-2 bg-transparent p-0 text-sm font-medium link-blue border-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                    aria-label={`View TCDB details for ${row.name}`}
                  >
                    View details
                  </button>
                }
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
                className="border-b border-black/5 last:border-0"
              >
                <td className="tabular-nums text-ink/80">
                  <RankingDetailDialog
                    row={row}
                    trigger={
                      <button
                        type="button"
                        className="link-blue bg-transparent p-0 text-left font-medium border-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                        aria-haspopup="dialog"
                        aria-label={`View TCDB details for ${row.name}`}
                      >
                        {row.homie_id}
                      </button>
                    }
                  />
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
  );
}
