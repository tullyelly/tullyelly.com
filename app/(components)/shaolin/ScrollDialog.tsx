'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';

type ScrollDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  id: string | number | null;
};

type ShaolinScroll = Record<string, unknown>;

export default function ScrollDialog({ open, onOpenChange, id }: ScrollDialogProps) {
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
        setRow(data.row as ShaolinScroll);
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
          <Dialog.Title className="text-xl font-semibold">Scroll {id}</Dialog.Title>
          <Dialog.Close className="absolute right-4 top-4" aria-label="Close">
            ×
          </Dialog.Close>
          <div className="mt-4">
            {loading && <p>Loading…</p>}
            {error && <p>Error loading scroll.</p>}
            {!loading && !error && row && (
              <dl className="space-y-2 text-sm">
                {Object.entries(row).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4">
                    <dt className="font-medium">{key}</dt>
                    <dd className="text-right">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

