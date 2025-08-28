'use client';

import { useState } from 'react';
import type { Release } from './ScrollsTable';
import { ScrollsTable } from './ScrollsTable';
import Toolbar from './filters/Toolbar';

export default function ScrollsPageClient({ data }: { data: Release[] }) {
  const [search, setSearch] = useState('');
  return (
    <div className="flex flex-col gap-3">
      <Toolbar search={search} onSearchChange={setSearch} />
      <ScrollsTable data={data} globalFilter={search} />
    </div>
  );
}

