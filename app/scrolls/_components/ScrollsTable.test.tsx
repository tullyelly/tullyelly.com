import { render, screen } from '@testing-library/react';
import ScrollsTable, { Release } from './ScrollsTable';

const baseRelease: Release = {
  id: '1',
  name: 'Release 1',
  plannedDate: '2025-01',
  status: 'planned',
  type: 'patch',
  semver: 'v1.0.0',
};

test('header and cell counts match', () => {
  const data = [baseRelease];
  const { container } = render(<ScrollsTable data={data} pageSize={10} />);
  const headerCells = container.querySelectorAll('thead tr th');
  const firstRow = container.querySelector('tbody tr');
  const bodyCells = firstRow ? firstRow.querySelectorAll('td') : [];
  expect(headerCells.length).toBe(bodyCells.length);
});

test('has sticky header', () => {
  const data = [baseRelease];
  const { container } = render(<ScrollsTable data={data} pageSize={10} />);
  const thead = container.querySelector('thead');
  expect(thead).toHaveClass('sticky', 'top-0');
});

test('truncates long names', () => {
  const longName = 'Very long release name that should be truncated for display purposes';
  const data: Release[] = [{ ...baseRelease, id: '2', name: longName }];
  render(<ScrollsTable data={data} pageSize={10} />);
  const cell = screen.getByText(longName);
  expect(cell).toHaveClass('truncate');
  expect(cell).toHaveAttribute('title', longName);
});
