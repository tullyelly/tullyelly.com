'use client';

import { Fragment, useEffect, useState } from 'react';

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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Row | null>(null);

  useEffect(() => {
    if (!open || data || loading || error) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/releases/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json() as Promise<Row>;
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError('error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, data, loading, error, id]);

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    setOpen(e.currentTarget.open);
  };

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

