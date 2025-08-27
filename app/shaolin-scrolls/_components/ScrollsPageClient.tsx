'use client';

import { useState } from 'react';
import type { Release } from './ScrollsTable';
import { ScrollsTable } from './ScrollsTable';
import Toolbar from './filters/Toolbar';

export default function ScrollsPageClient({ data }: { data: Release[] }) {
  const [search, setSearch] = useState('');
  return (
    <div className="flex flex-col h-full gap-3">
      <Toolbar search={search} onSearchChange={setSearch} />
      <div className="flex-1 min-h-0">
        <ScrollsTable data={data} globalFilter={search} />
      </div>
    </div>
  );
}

