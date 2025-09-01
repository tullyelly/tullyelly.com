'use client';

import { useState } from 'react';
import type { Release } from './ScrollsTable';
import { ScrollsTable } from './ScrollsTable';

export default function ScrollsPageClient({ initialData }: { initialData: Release[] }) {
  const [data] = useState<Release[]>(() => initialData);
  // Keep client filter empty for SSR/CSR parity; search now submits through ActionBar form
  const [search] = useState('');
  return (
    <div className="flex flex-col gap-3">
      <section id="table-zone">
        <ScrollsTable data={data} globalFilter={search} />
      </section>
    </div>
  );
}
