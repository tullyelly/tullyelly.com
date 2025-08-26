'use client';

import { useState } from 'react';

type Id = string | number;

interface ReleaseData {
  semver: string;
  label: string | null;
  status: string;
  release_type: string;
}

interface Props {
  id: Id;
  summaryText?: string;
}

export default function ReleaseRowDetail({ id, summaryText = 'Details' }: Props) {
  const [data, setData] = useState<ReleaseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onToggle = async (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (!e.currentTarget.open || data || loading) return;

    setLoading(true);
    setError(null);

    const controller = new AbortController();

    try {
      const res = await fetch(`/api/releases/${id}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ReleaseData = await res.json();
      setData(json);
    } catch (err) {
      if ((err as any)?.name !== 'AbortError') {
        setError('Failed to load details');
      }
    } finally {
      setLoading(false);
    }

    // Cleanup if the details close before fetch resolves
    e.currentTarget.addEventListener(
      'toggle',
      () => {
        if (!e.currentTarget.open) controller.abort();
      },
      { once: true }
    );
  };

  let content: React.ReactNode = null;

  if (loading) {
    content = <p>Loading…</p>;
  } else if (error) {
    content = <p>{error}</p>;
  } else if (data) {
    content = (
      <dl>
        <div>
          <dt>Version</dt>
          <dd>{data.semver}</dd>
        </div>
        <div>
          <dt>Label</dt>
          <dd>{data.label ?? '—'}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{data.status}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{data.release_type}</dd>
        </div>
      </dl>
    );
  }

  return (
    <details onToggle={onToggle}>
      <summary>{summaryText}</summary>
      {content}
    </details>
  );
}
