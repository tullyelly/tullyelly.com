import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScrollsTable from '@/components/ScrollsTable';
import type { ReleaseRow, PageMeta } from '@/types/releases';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/components/ReleaseRowDetail', () => ({
  __esModule: true,
  default: ({ id }: { id: number }) => <div data-testid={`detail-${id}`}>detail {id}</div>,
}));

const rows: ReleaseRow[] = [
  {
    id: '1',
    name: 'v1',
    status: 'planned',
    type: 'minor',
    semver: '0.0.1',
    sem_major: 0,
    sem_minor: 0,
    sem_patch: 1,
    sem_hotfix: 0,
  },
];

const page: PageMeta = { limit: 20, offset: 0, sort: 'semver:desc', total: 1 };

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
