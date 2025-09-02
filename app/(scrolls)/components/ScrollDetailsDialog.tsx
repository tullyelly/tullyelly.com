'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';

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
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in" />
        <Dialog.Content
          className="bucks-surface bucks-border border-2 shadow-2xl rounded-2xl p-6 fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,640px)]"
        >
          <Dialog.Title className="text-xl font-semibold">Release #{id}</Dialog.Title>
          {data ? (
            <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
              <div className="font-medium">Label</div>
              <div>{data.label}</div>
              <div className="font-medium">SemVer</div>
              <div>{data.semver}</div>
              <div className="font-medium">Status</div>
              <div>{data.status}</div>
              <div className="font-medium">Type</div>
              <div>{data.type}</div>
              <div className="font-medium">Year / Month</div>
              <div>
                {data.year} / {data.month}
              </div>
              <div className="font-medium">Release Date</div>
              <div>{data.release_date ?? '—'}</div>
            </div>
          ) : (
            <p className="mt-4">Loading…</p>
          )}
          <div className="mt-6 flex justify-end">
            <Dialog.Close className="px-4 py-2 rounded-lg border bucks-border hover:bg-white/30">
              Close
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
