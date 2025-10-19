"use client";

import * as Dialog from "@ui/dialog";
import { useEffect, useMemo, useState } from "react";
import type { Dateish } from "@/lib/datetime";
import { fmtDate, fmtDateTime } from "@/lib/datetime";
import { isTimestampKey } from "@/lib/dates";
import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";

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
  const [row, setRow] = useState<ShaolinScroll | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open || id == null) return;
    let active = true;
    setLoading(true);
    setError(false);
    setRow(null);
    fetch(`/api/shaolin-scrolls/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setRow(data as ShaolinScroll);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, id]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="app-dialog-overlay" />
        <Dialog.Content className="app-dialog-content">
          <div
            data-dialog-handle
            className="-mx-6 -mt-6 px-6 py-2 bg-[var(--blue)] text-white cursor-move touch-none flex items-center"
            style={{
              borderTopLeftRadius: "13px",
              borderTopRightRadius: "13px",
            }}
          >
            <Dialog.Title className="text-base font-semibold leading-6">
              Scroll {id}
            </Dialog.Title>
            <div className="ml-auto">
              <Dialog.Close
                className="inline-flex items-center justify-center rounded border border-white/80 px-2 py-0.5 text-white hover:opacity-80"
                aria-label="Close"
              >
                ×
              </Dialog.Close>
            </div>
          </div>
          <Dialog.Description className="sr-only">
            Details for this scroll
          </Dialog.Description>
          {/* Close button moved into header above */}
          <div className="mt-3">
            {loading && <p>Loading…</p>}
            {error && <p>Error loading scroll.</p>}
            {!loading && !error && row && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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

                  const r = row as Record<string, unknown>;

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
                      className="rounded border border-[var(--border-subtle)] p-2"
                    >
                      <div className="text-[11px] uppercase tracking-wide opacity-70">
                        {label}
                      </div>
                      <div className="text-sm font-medium break-words">
                        {renderValue(key, r[key])}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
