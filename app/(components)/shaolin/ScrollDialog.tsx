"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dateish } from "@/lib/datetime";
import { fmtDate, fmtDateTime } from "@/lib/datetime";
import { isTimestampKey } from "@/lib/dates";
import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import DialogPanel, {
  DialogPanelClose,
  DialogPanelDescription,
  DialogPanelTitle,
} from "@/components/ui/DialogPanel";

type ScrollDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  id: string | number | null;
};

type ShaolinScroll = Record<string, unknown>;

function formatTimestamp(key: string, value: unknown): string {
  const lower = key.toLowerCase();
  const dateish = value as Dateish;
  if (/_date$/.test(lower)) {
    return fmtDate(dateish);
  }
  if (/(?:_at|time)$/.test(lower)) {
    return fmtDateTime(dateish);
  }
  return fmtDateTime(dateish);
}

export default function ScrollDialog({
  open,
  onOpenChange,
  id,
}: ScrollDialogProps) {
  const router = useRouter();
  const [row, setRow] = useState<ShaolinScroll | null>(null);
  const [errorId, setErrorId] = useState<string | number | null>(null);
  const handleChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      router.replace("/mark2/shaolin-scrolls");
    }
  };

  const rowForId =
    row && id != null && String((row as { id?: unknown }).id) === String(id)
      ? row
      : null;
  const errorForId =
    errorId != null && id != null && String(errorId) === String(id);
  const loading = open && id != null && !rowForId && !errorForId;

  useEffect(() => {
    if (!open || id == null || rowForId) return;
    let active = true;
    const currentId = id;
    Promise.resolve().then(() => {
      if (active) setErrorId(null);
    });
    fetch(`/api/shaolin-scrolls/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setRow(data as ShaolinScroll);
        setErrorId(null);
      })
      .catch(() => {
        if (!active) return;
        setErrorId(currentId);
      });
    return () => {
      active = false;
    };
  }, [id, open, rowForId]);

  return (
    <DialogPanel open={open} onClose={() => handleChange(false)}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          data-dialog-handle
          className="sticky top-0 z-[1] flex items-center justify-between gap-3 rounded-t-2xl bg-[var(--blue)] px-5 py-3 text-white"
        >
          <DialogPanelTitle className="truncate text-base font-semibold leading-6">
            Scroll {id}
          </DialogPanelTitle>
          <DialogPanelClose asChild>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--blue)]"
              aria-label="Close dialog"
              onPointerDown={(event) => event.stopPropagation()}
            >
              ×
            </button>
          </DialogPanelClose>
        </div>
        <div className="modal-body grow" data-testid="modal-body">
          <DialogPanelDescription className="sr-only">
            Details for this scroll
          </DialogPanelDescription>
          {loading && <p>Loading…</p>}
          {errorForId && <p>Error loading scroll.</p>}
          {!loading && !errorForId && rowForId && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:[grid-template-columns:repeat(2,minmax(0,1fr))] xl:grid-cols-3 xl:[grid-template-columns:repeat(3,minmax(0,1fr))]">
              {(() => {
                const order: Array<{ key: string; label: string }> = [
                  { key: "id", label: "ID" },
                  { key: "release_name", label: "Release Name" },
                  { key: "semver", label: "SemVer" },

                  { key: "status", label: "Status" },
                  { key: "release_type", label: "Release Type" },
                  { key: "release_date", label: "Release Date" },

                  { key: "major", label: "Major" },
                  { key: "minor", label: "Minor" },
                  { key: "patch", label: "Patch" },

                  { key: "created_at", label: "Created At" },
                  { key: "created_by", label: "Created By" },
                  { key: "updated_at", label: "Updated At" },

                  { key: "updated_by", label: "Updated By" },
                  { key: "year", label: "Year" },
                  { key: "month", label: "Month" },
                ];

                const r = rowForId as Record<string, unknown>;

                const renderValue = (
                  key: string,
                  value: unknown,
                ): React.ReactNode => {
                  if (isTimestampKey(key)) {
                    return formatTimestamp(key, value);
                  }
                  if (value == null || value === "") return "";
                  if (key === "status") {
                    const v = String(value).toLowerCase() as any;
                    return (
                      <Badge className={getBadgeClass(v)}>
                        {String(value)}
                      </Badge>
                    );
                  }
                  if (key === "release_type") {
                    const v = String(value).toLowerCase() as any;
                    return (
                      <Badge className={getBadgeClass(v)}>
                        {String(value)}
                      </Badge>
                    );
                  }
                  return typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value);
                };

                return order.map(({ key, label }) => (
                  <div
                    key={key}
                    className="min-w-0 rounded border border-[var(--border-subtle)] bg-white p-3"
                  >
                    <div className="text-[11px] uppercase tracking-wide text-ink/70">
                      {label}
                    </div>
                    <div className="break-words text-sm font-medium text-ink">
                      {renderValue(key, r[key])}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>
    </DialogPanel>
  );
}
