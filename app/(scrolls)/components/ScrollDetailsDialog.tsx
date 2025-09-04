'use client';

import * as Dialog from '@ui/dialog';
import { useEffect, useState } from 'react';
import { formatReleaseDate } from './formatReleaseDate';
import { Badge } from '@/app/ui/Badge';
import { getBadgeClass } from '@/app/ui/badge-maps';

type Details = {
  id: number;
  label: string;
  semver: string;
  status: string;
  type: string;
  year: number;
  month: number;
  release_date: string | null;
};

export function ScrollDetailsDialog({ id, trigger }: { id: number; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Details | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const res = await fetch(`/api/scrolls/${id}`);
      if (res.ok) setData(await res.json());
    })();
  }, [open, id]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="app-dialog-overlay data-[state=open]:animate-in" />
        <Dialog.Content className="app-dialog-content">
          <div
            data-dialog-handle
            className="-mx-6 -mt-6 px-6 py-2 bg-[var(--blue)] text-white cursor-move touch-none flex items-center"
            style={{ borderTopLeftRadius: '13px', borderTopRightRadius: '13px' }}
          >
            <Dialog.Title className="text-base font-semibold leading-6">Release #{id}</Dialog.Title>
            <div className="ml-auto">
              <Dialog.Close className="inline-flex items-center justify-center rounded border border-white/80 px-2 py-0.5 text-white hover:opacity-80" aria-label="Close">
                ×
              </Dialog.Close>
            </div>
          </div>
          <Dialog.Description className="sr-only">Details for this release</Dialog.Description>
          {data ? (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="rounded border border-[var(--border-subtle)] p-2">
                <div className="text-[11px] uppercase tracking-wide opacity-70">ID</div>
                <div className="text-sm font-medium break-words">{data.id}</div>
              </div>
              <div className="rounded border border-[var(--border-subtle)] p-2">
                <div className="text-[11px] uppercase tracking-wide opacity-70">Label</div>
                <div className="text-sm font-medium break-words">{data.label ?? ''}</div>
              </div>
              <div className="rounded border border-[var(--border-subtle)] p-2">
                <div className="text-[11px] uppercase tracking-wide opacity-70">SemVer</div>
                <div className="text-sm font-medium break-words">{data.semver ?? ''}</div>
              </div>
              <div className="rounded border border-[var(--border-subtle)] p-2">
                <div className="text-[11px] uppercase tracking-wide opacity-70">Status</div>
                <div className="text-sm font-medium break-words">
                  {data.status ? <Badge className={getBadgeClass(data.status as any)}>{data.status}</Badge> : ''}
                </div>
              </div>
              <div className="rounded border border-[var(--border-subtle)] p-2">
                <div className="text-[11px] uppercase tracking-wide opacity-70">Release Type</div>
                <div className="text-sm font-medium break-words">
                  {data.type ? <Badge className={getBadgeClass(data.type as any)}>{data.type}</Badge> : ''}
                </div>
              </div>
              <div className="rounded border border-[var(--border-subtle)] p-2">
                <div className="text-[11px] uppercase tracking-wide opacity-70">Release Date</div>
                <div className="text-sm font-medium break-words">{formatReleaseDate(data.release_date)}</div>
              </div>
              <div className="rounded border border-[var(--border-subtle)] p-2">
                <div className="text-[11px] uppercase tracking-wide opacity-70">Year</div>
                <div className="text-sm font-medium break-words">{data.year ?? ''}</div>
              </div>
              <div className="rounded border border-[var(--border-subtle)] p-2">
                <div className="text-[11px] uppercase tracking-wide opacity-70">Month</div>
                <div className="text-sm font-medium break-words">{data.month ?? ''}</div>
              </div>
            </div>
          ) : (
            <p className="mt-4">Loading…</p>
          )}
          <div className="mt-6 flex justify-end">
            <Dialog.Close className="px-4 py-2 rounded-lg border border-[var(--blue)] hover:bg-black/5">
              Close
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
