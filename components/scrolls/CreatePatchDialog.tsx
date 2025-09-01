"use client";

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
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
        <button
          type="button"
          className="rounded border px-3 py-1 bg-white hover:bg-neutral-50"
        >
          Create Patch
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-4 shadow-lg outline-none">
          <Dialog.Title className="text-lg font-medium">Create Patch</Dialog.Title>
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
                className="w-full rounded border px-2 py-1"
                placeholder="e.g. hotfix: correct audit trail ordering"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex items-center justify-end gap-2">
              <Dialog.Close asChild>
                <button type="button" className="rounded border px-3 py-1">Cancel</button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending}
                className="rounded border px-3 py-1 bg-[#00471B] text-white disabled:opacity-60"
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

