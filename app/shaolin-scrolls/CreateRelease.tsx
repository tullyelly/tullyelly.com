'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function CreateRelease() {
  const [patchLabel, setPatchLabel] = useState('');
  const [minorLabel, setMinorLabel] = useState('');

  async function submit(type: 'patch' | 'minor', label: string, reset: (v: string) => void) {
    const trimmed = label.trim();
    if (!trimmed) return;
    await fetch(`/api/releases/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: trimmed }),
    });
    reset('');
  }

  return (
    <div className={styles.create}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit('patch', patchLabel, setPatchLabel);
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
      </form>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit('minor', minorLabel, setMinorLabel);
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
      </form>
    </div>
  );
}
