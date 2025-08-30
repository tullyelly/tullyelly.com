const rows = [
  {
    id: '1',
    name: 'Alpha',
    status: 'planned',
    type: 'minor',
    semver: '0.1.0',
    sem_major: 0,
    sem_minor: 1,
    sem_patch: 0,
    sem_hotfix: 0,
    created_at: new Date('2024-01-01T00:00:00Z'),
  },
];

jest.mock('@/db/pool', () => ({
  getPool: () => ({
    query: (sql: string, params: unknown[] = []) => {
      if (sql.includes('SELECT 1')) {
        return Promise.resolve({ rows: [{ result: 1 }] });
      }
      if (sql.includes('COUNT')) {
        return Promise.resolve({ rows: [{ total: rows.length }] });
      }
      return Promise.resolve({ rows });
    },
  }),
}));

import { getReleases } from '@/lib/releases';

describe('getReleases', () => {
  it('returns ISO date strings', async () => {
    const res = await getReleases({ limit: 10, offset: 0, sort: 'created_at:desc' });
    expect(res.items[0].created_at).toBe('2024-01-01T00:00:00.000Z');
    expect(typeof res.items[0].created_at).toBe('string');
  });
});
