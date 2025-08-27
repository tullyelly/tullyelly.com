import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { ScrollsTable, Release } from './ScrollsTable';

function makeRelease(i: number): Release {
  return {
    id: String(i),
    name: `Release ${i}`,
    plannedDate: '2025-01',
    status: i % 2 ? 'planned' : 'released',
    type: i % 3 === 0 ? 'patch' : i % 3 === 1 ? 'minor' : 'hotfix',
    semver: `v1.0.${i}`,
  };
}

function TableWithSearch({ data }: { data: Release[] }) {
  const [filter, setFilter] = useState('');
  return (
    <>
      <input aria-label="Search releases" value={filter} onChange={(e) => setFilter(e.target.value)} />
      <ScrollsTable data={data} pageSize={10} globalFilter={filter} />
    </>
  );
}

test('renders rows', () => {
  const data = [makeRelease(1), makeRelease(2)];
  render(<ScrollsTable data={data} pageSize={10} globalFilter="" />);
  expect(screen.getByText('Release 1')).toBeInTheDocument();
  expect(screen.getByText('Release 2')).toBeInTheDocument();
});

test('sorts by SemVer', () => {
  const data: Release[] = [
    { id: '1', name: 'A', plannedDate: '2025-01', status: 'planned', type: 'patch', semver: 'v1.0.1' },
    { id: '2', name: 'B', plannedDate: '2025-01', status: 'planned', type: 'patch', semver: 'v1.0.0' },
  ];
  render(<ScrollsTable data={data} pageSize={10} globalFilter="" />);
  const semverHeader = screen.getByRole('button', { name: /semver/i });
  fireEvent.click(semverHeader);
  const rows = screen.getAllByRole('row');
  expect(rows[1]).toHaveTextContent('v1.0.0');
});

test('filters by name', () => {
  const data = [makeRelease(1), makeRelease(2), makeRelease(3)];
  render(<TableWithSearch data={data} />);
  fireEvent.change(screen.getByLabelText(/search releases/i), { target: { value: 'Release 2' } });
  expect(screen.getByText('Release 2')).toBeInTheDocument();
  expect(screen.queryByText('Release 1')).toBeNull();
});

test('paginates to next page', () => {
  const data = Array.from({ length: 25 }, (_, i) => makeRelease(i));
  render(<ScrollsTable data={data} pageSize={10} globalFilter="" />);
  expect(screen.queryByText('Release 15')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  expect(screen.getByText('Release 15')).toBeInTheDocument();
});

