"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@ui";
import * as Dialog from "@ui/dialog";
import { Table, TBody, THead } from "@/components/ui/Table";
import TablePager from "@/components/ui/TablePager";
import TrendPill from "@/components/tcdb/TrendPill";
import type { HomieDirectoryRow } from "@/lib/data/homies";
import { setPersistentBanner } from "@/lib/persistent-banner";

const integer = new Intl.NumberFormat("en-US");
const PAGE_SIZES = [25, 50, 100];
type Editable = Pick<HomieDirectoryRow, "name" | "tag_slug" | "drafted">;

function values(row: HomieDirectoryRow): Editable {
  return { name: row.name, tag_slug: row.tag_slug, drafted: row.drafted };
}

function HomieFields({
  value,
  onChange,
}: {
  value: Editable;
  onChange: (next: Editable) => void;
}) {
  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm">
        Name
        <input
          className="form-input"
          value={value.name}
          maxLength={100}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Tag slug
        <input
          className="form-input"
          value={value.tag_slug ?? ""}
          maxLength={100}
          onChange={(event) =>
            onChange({ ...value, tag_slug: event.target.value || null })
          }
        />
      </label>
      <p className="text-xs text-ink/70">
        Changing the tag slug changes the preferred homie URL.
      </p>
      <label className="grid gap-1 text-sm">
        Drafted
        <input
          className="form-input"
          type="number"
          min={0}
          max={65535}
          value={value.drafted}
          onChange={(event) =>
            onChange({ ...value, drafted: Number(event.target.value) })
          }
        />
      </label>
    </div>
  );
}

export default function HomieDirectory({
  initialRows,
  canUpdate,
}: {
  initialRows: HomieDirectoryRow[];
  canUpdate: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [drafts, setDrafts] = useState<Record<number, Editable>>({});
  const [unlocked, setUnlocked] = useState(false);
  const [q, setQ] = useState("");
  const [trend, setTrend] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [pendingIds, setPendingIds] = useState<Set<number>>(() => new Set());
  const [mobileEdit, setMobileEdit] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesText =
        !needle ||
        [
          row.name,
          row.tag_slug ?? "",
          String(row.drafted),
          String(row.id),
        ].some((value) => value.toLowerCase().includes(needle));
      return matchesText && (!trend || (row.trend_overall ?? "") === trend);
    });
  }, [q, rows, trend]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const changed = (row: HomieDirectoryRow) => {
    const draft = drafts[row.id];
    return !!draft && JSON.stringify(draft) !== JSON.stringify(values(row));
  };
  const updateDraft = (row: HomieDirectoryRow, next: Editable) =>
    setDrafts((current) => ({ ...current, [row.id]: next }));

  function toggleEditing() {
    if (!unlocked) {
      setUnlocked(true);
      return;
    }

    const hasUnsavedChanges = rows.some((row) => changed(row));
    if (
      hasUnsavedChanges &&
      !window.confirm("Discard all unsaved changes and lock editing?")
    ) {
      return;
    }

    setDrafts({});
    setUnlocked(false);
  }

  async function save(row: HomieDirectoryRow) {
    const draft = drafts[row.id] ?? values(row);
    setPendingIds((current) => new Set(current).add(row.id));
    try {
      const response = await fetch(`/api/homies/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          expected_updated_at: row.updated_at,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        const fields = result.fieldErrors
          ? Object.values(result.fieldErrors).flat().join(" ")
          : "";
        throw new Error(
          fields ||
            (response.status === 409
              ? "Conflict: this record changed or the slug is already used."
              : response.status === 401 || response.status === 403
                ? "You are not authorized to update this homie."
                : "The update failed. Try again."),
        );
      }
      setRows((current) =>
        current.map((item) =>
          item.id === row.id
            ? {
                ...item,
                ...result,
                route_slug: result.tag_slug || String(item.id),
              }
            : item,
        ),
      );
      setDrafts((current) => {
        const next = { ...current };
        delete next[row.id];
        return next;
      });
      setPersistentBanner({
        message: `${draft.name} was saved.`,
        variant: "success",
      });
      setMobileEdit(null);
    } catch (error) {
      setPersistentBanner({
        message:
          error instanceof Error ? error.message : "The homie update failed.",
        variant: "error",
      });
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(row.id);
        return next;
      });
    }
  }

  const resultMessage = `${filtered.length} homie${filtered.length === 1 ? "" : "s"} shown`;

  return (
    <section className="space-y-4" aria-label="Homie directory">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          className="form-input h-9 w-full md:w-64"
          aria-label="Search homies"
          placeholder="Search homies"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
        />
        <div className="flex gap-2">
          <select
            className="form-input h-9"
            aria-label="Filter by trend"
            value={trend}
            onChange={(event) => {
              setTrend(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All trends</option>
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="flat">Flat</option>
          </select>
          {canUpdate ? (
            <button
              className="btn whitespace-nowrap"
              aria-pressed={unlocked}
              disabled={pendingIds.size > 0}
              onClick={toggleEditing}
            >
              {pendingIds.size > 0
                ? "Saving changes..."
                : unlocked
                  ? "Lock Editing"
                  : "Unlock Editing"}
            </button>
          ) : null}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {resultMessage}
      </p>

      <ul className="space-y-3 md:hidden">
        {visible.map((row) => (
          <Card as="li" className="p-3" key={row.id}>
            <div className="flex justify-between gap-3">
              <div>
                <Link
                  href={`/cardattack/homies/${row.route_slug}`}
                  className="font-semibold"
                  data-testid="ranking-detail-trigger"
                >
                  {row.name}
                </Link>
                <p className="text-xs text-ink/70">Jersey {row.id}</p>
              </div>
              {row.trend_overall ? (
                <TrendPill trend={row.trend_overall} />
              ) : (
                <span>{"—"}</span>
              )}
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs uppercase text-ink/60">Tag slug</dt>
                <dd>{row.tag_slug ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-ink/60">Drafted</dt>
                <dd>{row.drafted}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-ink/60">Cards</dt>
                <dd>
                  {row.card_count === null
                    ? "—"
                    : integer.format(row.card_count)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-ink/60">Rank</dt>
                <dd>
                  {row.ranking === null ? "—" : integer.format(row.ranking)}
                </dd>
              </div>
            </dl>
            {canUpdate ? (
              <button
                className="btn mt-3"
                onClick={() => {
                  setMobileEdit(row.id);
                  updateDraft(row, drafts[row.id] ?? values(row));
                }}
              >
                Edit
              </button>
            ) : null}
          </Card>
        ))}
      </ul>

      <Table
        variant="bucks"
        aria-label="Homie directory table"
        className={`hidden md:table ${unlocked && canUpdate ? "table-fixed" : ""}`}
      >
        {unlocked && canUpdate ? (
          <colgroup>
            <col className="w-[7%]" />
            <col className="w-[42%]" />
            <col className="w-[18%]" />
            <col className="w-[15%]" />
            <col className="w-[18%]" />
          </colgroup>
        ) : null}
        <THead variant="bucks">
          <th>Jersey</th>
          <th>Name</th>
          <th>Tag slug</th>
          <th>Drafted</th>
          {!unlocked || !canUpdate ? (
            <>
              <th>Cards</th>
              <th>Rank</th>
              <th>Trend</th>
            </>
          ) : null}
          {unlocked && canUpdate ? <th>Actions</th> : null}
        </THead>
        <TBody>
          {visible.map((row) => {
            const draft = drafts[row.id] ?? values(row);
            return (
              <tr key={row.id}>
                <td>
                  <Link
                    data-testid="ranking-detail-trigger"
                    href={`/cardattack/homies/${row.route_slug}`}
                    onClick={(event) => {
                      if (
                        changed(row) &&
                        !window.confirm(
                          "Discard unsaved changes and open this homie?",
                        )
                      )
                        event.preventDefault();
                    }}
                  >
                    {row.id}
                  </Link>
                </td>
                <td>
                  {unlocked && canUpdate ? (
                    <input
                      aria-label={`Name for ${row.name}`}
                      className="form-input w-full min-w-0"
                      value={draft.name}
                      onChange={(e) =>
                        updateDraft(row, { ...draft, name: e.target.value })
                      }
                    />
                  ) : (
                    row.name
                  )}
                </td>
                <td>
                  {unlocked && canUpdate ? (
                    <div>
                      <input
                        aria-label={`Tag slug for ${row.name}`}
                        className="form-input w-full min-w-0"
                        value={draft.tag_slug ?? ""}
                        onChange={(e) =>
                          updateDraft(row, {
                            ...draft,
                            tag_slug: e.target.value || null,
                          })
                        }
                      />
                      <span className="sr-only">
                        Changing the tag slug changes the preferred homie URL.
                      </span>
                    </div>
                  ) : (
                    (row.tag_slug ?? "—")
                  )}
                </td>
                <td>
                  {unlocked && canUpdate ? (
                    <input
                      aria-label={`Drafted for ${row.name}`}
                      className="form-input w-full min-w-0"
                      type="number"
                      min={0}
                      max={65535}
                      value={draft.drafted}
                      onChange={(e) =>
                        updateDraft(row, {
                          ...draft,
                          drafted: Number(e.target.value),
                        })
                      }
                    />
                  ) : (
                    row.drafted
                  )}
                </td>
                {!unlocked || !canUpdate ? (
                  <>
                    <td>
                      {row.card_count === null
                        ? "—"
                        : integer.format(row.card_count)}
                    </td>
                    <td>
                      {row.ranking === null ? "—" : integer.format(row.ranking)}
                    </td>
                    <td>
                      {row.trend_overall ? (
                        <TrendPill trend={row.trend_overall} />
                      ) : (
                        "—"
                      )}
                    </td>
                  </>
                ) : null}
                {unlocked && canUpdate ? (
                  <td>
                    <div className="flex flex-col gap-2 lg:flex-row">
                      <button
                        className="btn"
                        disabled={!changed(row) || pendingIds.has(row.id)}
                        onClick={() => void save(row)}
                      >
                        {pendingIds.has(row.id) ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="btn"
                        disabled={!changed(row) || pendingIds.has(row.id)}
                        onClick={() =>
                          setDrafts((current) => {
                            const next = { ...current };
                            delete next[row.id];
                            return next;
                          })
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </TBody>
      </Table>

      <TablePager
        page={page}
        pageSize={pageSize}
        total={filtered.length}
        isPending={false}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      <Dialog.Root
        open={mobileEdit !== null}
        onOpenChange={(open) => {
          if (!open) setMobileEdit(null);
        }}
      >
        <Dialog.Content className="w-[min(92vw,28rem)] p-5">
          <Dialog.Title className="text-lg font-semibold">
            Edit homie
          </Dialog.Title>
          <Dialog.Description className="mb-4 text-sm text-ink/70">
            Update the homie record, then save explicitly.
          </Dialog.Description>
          {mobileEdit !== null
            ? (() => {
                const row = rows.find((item) => item.id === mobileEdit);
                if (!row) return null;
                const draft = drafts[row.id] ?? values(row);
                return (
                  <>
                    <HomieFields
                      value={draft}
                      onChange={(next) => updateDraft(row, next)}
                    />
                    <div className="mt-5 flex justify-end gap-2">
                      <Dialog.Close asChild>
                        <button className="btn">Cancel</button>
                      </Dialog.Close>
                      <button
                        className="btn"
                        disabled={!changed(row) || pendingIds.has(row.id)}
                        onClick={() => void save(row)}
                      >
                        {pendingIds.has(row.id) ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </>
                );
              })()
            : null}
        </Dialog.Content>
      </Dialog.Root>
    </section>
  );
}
