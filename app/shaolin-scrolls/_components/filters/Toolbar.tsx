'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreatePatchDialog from '../../CreatePatchDialog';

interface ToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function Toolbar({ search, onSearchChange }: ToolbarProps) {
  const router = useRouter();

  const [minorLabel, setMinorLabel] = useState('');
  const [minorLoading, setMinorLoading] = useState(false);
  const [minorError, setMinorError] = useState<string | null>(null);
  const [minorCreated, setMinorCreated] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const label = minorLabel.trim().slice(0, 120);
    if (!label) return;

    setMinorLoading(true);
    setMinorError(null);
    setMinorCreated(false);

    try {
      const res = await fetch('/api/releases/minor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) throw new Error('Request failed');
      setMinorLabel('');
      setMinorCreated(true);
      router.refresh();
    } catch {
      setMinorError('Failed to create minor release');
    } finally {
      setMinorLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CreatePatchDialog onCreated={() => router.refresh()} />

      <div className="flex flex-col">
        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            id="minor-label"
            aria-label="Minor label"
            value={minorLabel}
            onChange={(e) => setMinorLabel(e.target.value)}
            maxLength={120}
            placeholder="Minor label"
            className="rounded border px-2 py-1"
            required
          />
          <button
            type="submit"
            disabled={minorLoading}
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            {minorLoading ? 'Creating…' : 'Create Minor'}
          </button>
        </form>
        {minorError && <p className="text-xs text-red-600">{minorError}</p>}
        {minorCreated && <p className="text-xs text-green-600">Created</p>}
      </div>

      <div className="grow" />
      <input
        aria-label="Search releases"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search releases"
        className="rounded border px-2 py-1"
      />
    </div>
  );
}

