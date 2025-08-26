'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateRelease() {
  const router = useRouter();
  const [patchLabel, setPatchLabel] = useState('');
  const [minorLabel, setMinorLabel] = useState('');
  const [patchMsg, setPatchMsg] = useState('');
  const [minorMsg, setMinorMsg] = useState('');

  async function submit(
    type: 'patch' | 'minor',
    label: string,
    setLabel: (v: string) => void,
    setMsg: (v: string) => void
  ) {
    const trimmed = label.trim().slice(0, 120);
    if (!trimmed) return;
    try {
      const res = await fetch(`/api/releases/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: trimmed }),
      });
      if (res.ok) {
        setLabel('');
        setMsg('Created');
        router.refresh();
      }
    } catch {
      // ignore errors for now
    }
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit('patch', patchLabel, setPatchLabel, setPatchMsg);
        }}
      >
        <label htmlFor="patch-label">Patch label</label>
        <input
          id="patch-label"
          name="patch-label"
          value={patchLabel}
          maxLength={120}
          onChange={(e) => setPatchLabel(e.target.value)}
          required
        />
        <button type="submit">Create Patch</button>
        {patchMsg && <small>{patchMsg}</small>}
      </form>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit('minor', minorLabel, setMinorLabel, setMinorMsg);
        }}
      >
        <label htmlFor="minor-label">Minor label</label>
        <input
          id="minor-label"
          name="minor-label"
          value={minorLabel}
          maxLength={120}
          onChange={(e) => setMinorLabel(e.target.value)}
          required
        />
        <button type="submit">Create Minor</button>
        {minorMsg && <small>{minorMsg}</small>}
      </form>
    </div>
  );
}

