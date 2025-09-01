'use client';

import { useState } from 'react';
import type { Release } from './ScrollsTable';
import { ScrollsTable } from './ScrollsTable';
import Toolbar from './filters/Toolbar';

export default function ScrollsPageClient({ initialData }: { initialData: Release[] }) {
  const [data] = useState<Release[]>(() => initialData);
  const [search, setSearch] = useState('');
  return (
    <div className="flex flex-col gap-3">
      <section id="action-zone">
        <Toolbar search={search} onSearchChange={setSearch} />
      </section>
      <section id="table-zone">
        <ScrollsTable data={data} globalFilter={search} />
      </section>
    </div>
  );
}
