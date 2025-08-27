'use client';

import { useState } from 'react';
import CreateRelease from '@/components/CreateRelease';

export default function ScrollsSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        className="mb-4 rounded border px-2 py-1 lg:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? 'Hide Filters' : 'Show Filters'}
      </button>
      <div className={`${open ? 'block' : 'hidden'} space-y-4 lg:block`}>
        <div>
          <h2 className="font-semibold">Filters</h2>
        </div>
        <CreateRelease />
      </div>
    </div>
  );
}

