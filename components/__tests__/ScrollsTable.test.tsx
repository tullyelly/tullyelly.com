import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScrollsTable from '@/components/ScrollsTable';
import type { ReleaseListItem, PageMeta } from '@/types/releases';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/components/ReleaseRowDetail', () => ({
  __esModule: true,
  default: ({ id }: { id: number }) => <div data-testid={`detail-${id}`}>detail {id}</div>,
}));

const rows: ReleaseListItem[] = [
  {
    id: 1,
    release_name: 'v1',
    status: 'planned',
    release_type: 'minor',
    created_at: '2024-01-01T00:00:00.000Z',
    semver: '0.0.1',
  },
];

const page: PageMeta = { limit: 20, offset: 0, sort: 'created_at:desc', total: 1 };

describe('ScrollsTable', () => {
  it('renders column headers', () => {
    render(<ScrollsTable rows={rows} total={1} page={page} />);
    expect(screen.getByRole('columnheader', { name: /Release Name/i })).toBeInTheDocument();
  });

  it('sort toggling updates aria-sort', () => {
    render(<ScrollsTable rows={rows} total={1} page={page} />);
    const header = screen.getByRole('columnheader', { name: /Release Name/i });
    expect(header).toHaveAttribute('aria-sort', 'none');
    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-sort', 'ascending');
  });

  it('row expansion mounts detail placeholder', () => {
    render(<ScrollsTable rows={rows} total={1} page={page} />);
    expect(screen.queryByTestId('detail-1')).toBeNull();
    const toggle = screen.getByLabelText('Expand row');
    fireEvent.click(toggle);
    expect(screen.getByTestId('detail-1')).toBeInTheDocument();
  });
});
