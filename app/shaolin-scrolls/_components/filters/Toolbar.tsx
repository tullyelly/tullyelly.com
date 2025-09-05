'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

type ReleaseType = 'patch' | 'minor';

export default function Toolbar({ search, onSearchChange }: ToolbarProps) {
  const router = useRouter();

  const [patchLabel, setPatchLabel] = useState('');
  const [patchLoading, setPatchLoading] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [patchCreated, setPatchCreated] = useState(false);

  const [minorLabel, setMinorLabel] = useState('');
  const [minorLoading, setMinorLoading] = useState(false);
  const [minorError, setMinorError] = useState<string | null>(null);
  const [minorCreated, setMinorCreated] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>, type: ReleaseType) {
    e.preventDefault();
    const isPatch = type === 'patch';
    const label = (isPatch ? patchLabel : minorLabel).trim().slice(0, 120);
    if (!label) return;

    if (isPatch) {
      setPatchLoading(true);
      setPatchError(null);
      setPatchCreated(false);
    } else {
      setMinorLoading(true);
      setMinorError(null);
      setMinorCreated(false);
    }

    try {
      const res = await fetch(`/api/releases/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) throw new Error('Request failed');
      if (isPatch) {
        setPatchLabel('');
        setPatchCreated(true);
      } else {
        setMinorLabel('');
        setMinorCreated(true);
      }
      router.refresh();
    } catch {
      if (isPatch) setPatchError('Failed to create patch release');
      else setMinorError('Failed to create minor release');
    } finally {
      if (isPatch) setPatchLoading(false);
      else setMinorLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-col">
        <form onSubmit={(e) => submit(e, 'patch')} className="flex items-center gap-2">
          <input
            id="patch-label"
            aria-label="Patch label"
            value={patchLabel}
            onChange={(e) => setPatchLabel(e.target.value)}
            maxLength={120}
            placeholder="Patch label"
            className="form-input"
            required
          />
          <button
            type="submit"
            disabled={patchLoading}
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            {patchLoading ? 'Creating…' : 'Create Patch'}
          </button>
        </form>
        {patchError && <p className="text-xs text-red-600">{patchError}</p>}
        {patchCreated && <p className="text-xs text-green-600">Created</p>}
      </div>

      <div className="flex flex-col">
        <form onSubmit={(e) => submit(e, 'minor')} className="flex items-center gap-2">
          <input
            id="minor-label"
            aria-label="Minor label"
            value={minorLabel}
            onChange={(e) => setMinorLabel(e.target.value)}
            maxLength={120}
            placeholder="Minor label"
            className="form-input"
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
        className="form-input"
      />
    </div>
  );
}

