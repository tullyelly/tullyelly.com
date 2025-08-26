'use client';

import { Fragment, useState } from 'react';

export interface Row {
  id: number;
  release_name: string;
  semver: string;
  major: number;
  minor: number;
  patch: number;
  year: number;
  month: number;
  label: string | null;
  status: string;
  release_type: string;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

interface Props {
  id: number;
}

export default function ReleaseRowDetail({ id }: Props) {
  const [data, setData] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(e: React.SyntheticEvent<HTMLDetailsElement>) {
    const isOpen = e.currentTarget.open;
    if (!isOpen || data || loading || error) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/releases/${id}`);
      if (!res.ok) throw new Error('fetch failed');
      const json: Row = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError('error');
    } finally {
      setLoading(false);
    }
  }

  let content: React.ReactNode = null;
  if (loading) {
    content = <p>Loading…</p>;
  } else if (error) {
    content = <p>Error loading details</p>;
  } else if (data) {
    const fields: (keyof Row)[] = [
      'id',
      'release_name',
      'semver',
      'major',
      'minor',
      'patch',
      'year',
      'month',
      'label',
      'status',
      'release_type',
      'created_at',
      'created_by',
      'updated_at',
      'updated_by',
    ];
    content = (
      <dl>
        {fields.map((key) => (
          <Fragment key={key}>
            <dt>{key}</dt>
            <dd>{String(data[key] ?? '')}</dd>
          </Fragment>
        ))}
      </dl>
    );
  }

  return (
    <details onToggle={handleToggle}>
      <summary>Details</summary>
      {content}
    </details>
  );
}

