'use client';

import * as Dialog from '@ui/dialog';
import { useEffect, useId, useRef, useState } from 'react';

type Props = { q: string };

export default function ActionBarClient({ q }: Props) {
  useEffect(() => {
    // noop to ensure we're on client
  }, []);
  return (
    <>
      <CreatePatchDialog />
      <CreateMinorDialog />
      <SearchBox initial={q} />
    </>
  );
}

function CreatePatchDialog() {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="btn" aria-controls={`patch-${id}`} aria-expanded={open}>
          Create Patch
        </button>
      </Dialog.Trigger>
      <Dialog.Portal forceMount>
        <Dialog.Overlay className="app-dialog-overlay" data-state={open ? 'open' : 'closed'} hidden={!open} />
        <Dialog.Content className="app-dialog-content" id={`patch-${id}`} data-state={open ? 'open' : 'closed'} hidden={!open} aria-hidden={!open}>
          <div data-dialog-handle style={{ cursor: 'move', touchAction: 'none', height: 0 }} aria-label="Drag dialog" />
          <Dialog.Description className="sr-only">Create a new patch</Dialog.Description>
          {/* form content placeholder */}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CreateMinorDialog() {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="btn" aria-controls={`minor-${id}`} aria-expanded={open}>
          Create Minor
        </button>
      </Dialog.Trigger>
      <Dialog.Portal forceMount>
        <Dialog.Overlay className="app-dialog-overlay" data-state={open ? 'open' : 'closed'} hidden={!open} />
        <Dialog.Content className="app-dialog-content" id={`minor-${id}`} data-state={open ? 'open' : 'closed'} hidden={!open} aria-hidden={!open}>
          <div data-dialog-handle style={{ cursor: 'move', touchAction: 'none', height: 0 }} aria-label="Drag dialog" />
          <Dialog.Description className="sr-only">Create a new minor release</Dialog.Description>
          {/* form content placeholder */}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SearchBox({ initial }: { initial: string }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== initial) {
      inputRef.current.value = initial;
    }
  }, [initial]);
  return (
      <form role="search" action="/shaolin-scrolls" method="get" className="inline-flex items-center gap-2">
        <input
          ref={inputRef}
          name="q"
          type="search"
          placeholder="Search releases"
          aria-label="Search releases"
          defaultValue={initial ?? ''}
          className="form-input"
          autoComplete="off"
        />
        <button type="submit" className="btn">
          Search
        </button>
      </form>
  );
}
