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
    const target = e.currentTarget;
    if (!target.open || data || loading) return;

    const controller = new AbortController();
    const abortIfClosed = () => {
      if (!target.open) controller.abort();
    };
    target.addEventListener('toggle', abortIfClosed, { once: true });

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/releases/${id}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ReleaseData = await res.json();
      setData(json);
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        setError('Failed to load details');
      }
    } finally {
      setLoading(false);
    }
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