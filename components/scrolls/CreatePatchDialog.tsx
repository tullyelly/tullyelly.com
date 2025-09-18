"use client";

import * as React from 'react';
import * as Dialog from '@ui/dialog';
import { useRouter } from 'next/navigation';
import { createPatch } from '@/lib/actions/scrolls';

export default function CreatePatchDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = label.trim();
    if (!value) return;
    setError(null);
    startTransition(async () => {
      try {
        await createPatch(value);
        setLabel('');
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError('Failed to create patch');
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="btn">
          Create Patch
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="app-dialog-overlay" />
        <Dialog.Content className="app-dialog-content outline-none">
          <div
            data-dialog-handle
            className="-mx-6 -mt-6 px-6 py-2 bg-[var(--blue)] text-white cursor-move touch-none flex items-center"
            style={{ borderTopLeftRadius: '13px', borderTopRightRadius: '13px' }}
          >
            <Dialog.Title className="text-base font-semibold leading-6">Create Patch</Dialog.Title>
            <div className="ml-auto">
              <Dialog.Close className="inline-flex items-center justify-center rounded border border-white/80 px-2 py-0.5 text-white hover:opacity-80" aria-label="Close">
                ×
              </Dialog.Close>
            </div>
          </div>
          <Dialog.Description className="mt-1 text-sm opacity-70">
            Enter a label for the new patch release.
          </Dialog.Description>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <div className="space-y-1">
              <label htmlFor="patch-label" className="text-sm font-medium">
                Label
              </label>
              <input
                id="patch-label"
                name="patch-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={120}
                required
                className="form-input w-full"
                placeholder="e.g. hotfix: correct audit trail ordering"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex items-center justify-end gap-2">
              <Dialog.Close asChild>
                <button type="button" className="btn">Cancel</button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending}
                className="btn"
              >
                {isPending ? 'Creating…' : 'Create Patch'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
