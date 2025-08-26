"use client";

import { useState } from 'react';

interface ReleaseRowDetailProps {
  id: string | number;
}

interface ReleaseData {
  semver: string;
  label: string;
  status: string;
  release_type: string;
}

export default function ReleaseRowDetail({ id }: ReleaseRowDetailProps) {
  const [data, setData] = useState<ReleaseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const onToggle = async (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (!e.currentTarget.open || data) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/releases/${id}`);
      if (!res.ok) throw new Error('Failed to load');
      const json: ReleaseData = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  let content = null;
  if (loading) {
    content = <p>Loading…</p>;
  } else if (error) {
    content = <p>Error loading details</p>;
  } else if (data) {
    content = (
      <dl>
        <div>
          <dt>Version</dt>
          <dd>{data.semver}</dd>
        </div>
        <div>
          <dt>Label</dt>
          <dd>{data.label}</dd>
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

  return <details onToggle={onToggle}>{content}</details>;
}

