import type React from 'react';

// RSC-safe, presentational table for Shaolin Scrolls
// No client hooks; no side effects. Accepts rows + minimal props.

export type ScrollRow = {
  id: string;
  name: string;
  plannedDate?: string;
  status?: string;
  type?: string;
  semver: string;
};

export type RenderStatus = (status: string | undefined) => React.ReactNode;

export function ScrollsTable({
  rows,
  dense = false,
  showStatus = true,
  renderStatus,
  renderType,
  sort,
  buildSortHref,
  pageSize = 20,
  pageIndex = 0,
  total = 0,
  buildPageHref,
  className = '',
}: {
  rows: ScrollRow[];
  dense?: boolean;
  showStatus?: boolean;
  renderStatus?: RenderStatus;
  renderType?: (type: string | undefined) => React.ReactNode;
  sort?: 'semver:asc' | 'semver:desc';
  buildSortHref?: (next: 'semver:asc' | 'semver:desc') => string;
  pageSize?: number;
  pageIndex?: number;
  total?: number;
  buildPageHref?: (index: number) => string;
  className?: string;
}) {
  const cellPad = dense ? 'px-3 py-2' : 'px-4 py-3';
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const canPrev = pageIndex > 0;
  const canNext = pageIndex + 1 < pageCount;
  const nextSort: 'semver:asc' | 'semver:desc' = sort === 'semver:asc' ? 'semver:desc' : 'semver:asc';

  return (
    <div id="scrolls-table" className={["flex flex-col", className].join(' ').trim()}>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <table className="min-w-full table-auto">
          <thead className="bg-[#00471B] text-[#EEE1C6]">
            <tr>
              <th scope="col" className={[cellPad, 'text-left text-sm font-medium'].join(' ')}>
                Release Name
              </th>
              {showStatus && (
                <th
                  scope="col"
                  className={[cellPad, 'text-left text-sm font-medium w-[120px]'].join(' ')}
                >
                  Status
                </th>
              )}
              <th scope="col" className={[cellPad, 'text-left text-sm font-medium w-[100px]'].join(' ')}>
                Type
              </th>
              <th scope="col" className={[cellPad, 'text-right text-sm font-medium w-24'].join(' ')}>
                {buildSortHref ? (
                  <a
                    href={buildSortHref(nextSort)}
                    aria-label={`Sort by SemVer ${nextSort === 'semver:asc' ? 'ascending' : 'descending'}`}
                    className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
                  >
                    SemVer
                    <span className="text-[#EEE1C6]/80">
                      {sort === 'semver:asc' ? '▲' : sort === 'semver:desc' ? '▼' : ''}
                    </span>
                  </a>
                ) : (
                  'SemVer'
                )}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td className={[cellPad, 'text-center text-sm'].join(' ')} colSpan={showStatus ? 4 : 3}>
                  No releases found
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#EEE1C6]'}>
                  <td className={[cellPad, 'text-left align-middle whitespace-nowrap'].join(' ')}>
                    <span className="block truncate" title={r.name}>
                      {r.name}
                    </span>
                  </td>
                  {showStatus && (
                    <td className={[cellPad, 'text-left align-middle whitespace-nowrap w-[120px]'].join(' ')}>
                      {renderStatus ? renderStatus(r.status) : r.status}
                    </td>
                  )}
                  <td className={[cellPad, 'text-left align-middle whitespace-nowrap w-[100px]'].join(' ')}>
                    {renderType ? renderType(r.type) : r.type}
                  </td>
                  <td className={[cellPad, 'text-right align-middle whitespace-nowrap w-24 font-mono tabular-nums'].join(' ')}>
                    {r.semver}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {buildPageHref && (
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm">Rows per page: {pageSize}</div>
          <div className="flex items-center gap-1">
            <a
              aria-label="First page"
              aria-disabled={!canPrev}
              className={`rounded border px-2 py-1 ${!canPrev ? 'pointer-events-none opacity-50' : ''}`}
              href={canPrev ? buildPageHref(0) : '#'}
            >
              {'<<'}
            </a>
            <a
              aria-label="Previous page"
              aria-disabled={!canPrev}
              className={`rounded border px-2 py-1 ${!canPrev ? 'pointer-events-none opacity-50' : ''}`}
              href={canPrev ? buildPageHref(pageIndex - 1) : '#'}
            >
              {'<'}
            </a>
            <span className="px-2 text-sm">
              Page {pageIndex + 1} of {pageCount}
            </span>
            <a
              aria-label="Next page"
              aria-disabled={!canNext}
              className={`rounded border px-2 py-1 ${!canNext ? 'pointer-events-none opacity-50' : ''}`}
              href={canNext ? buildPageHref(pageIndex + 1) : '#'}
            >
              {'>'}
            </a>
            <a
              aria-label="Last page"
              aria-disabled={!canNext}
              className={`rounded border px-2 py-1 ${!canNext ? 'pointer-events-none opacity-50' : ''}`}
              href={canNext ? buildPageHref(pageCount - 1) : '#'}
            >
              {'>>'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
