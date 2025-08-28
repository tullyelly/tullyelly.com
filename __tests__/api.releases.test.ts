import type { ReleaseListResponse, ReleaseRow } from '@/app/api/releases/route';

const rows: ReleaseRow[] = [
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
  },
  {
    id: '2',
    name: 'Beta',
    status: 'released',
    type: 'major',
    semver: '1.0.0',
    sem_major: 1,
    sem_minor: 0,
    sem_patch: 0,
    sem_hotfix: 0,
  },
];

jest.mock('@/db/pool', () => ({
  getPool: () => ({
    query: (sql: string, params: unknown[] = []) => {
      // health check ping
      if (sql.includes('SELECT 1')) {
        return Promise.resolve({ rows: [{ result: 1 }] });
      }
      if (sql.includes('COUNT')) {
        const q = params[0] as string | undefined;
        return Promise.resolve({ rows: [{ total: q ? 0 : rows.length }] });
      }
      const hasQ = params.length === 3;
      const limit = (params[params.length - 2] as number) ?? rows.length;
      const offset = (params[params.length - 1] as number) ?? 0;
      const sliced = hasQ ? [] : rows.slice(offset, offset + limit);
      return Promise.resolve({ rows: sliced });
    },
  }),
}));

import { GET } from '@/app/api/releases/route';

function makeReq(query = '') {
  return new Request(`http://localhost/api/releases${query}`);
}

describe('/api/releases', () => {
  it('respects limit/offset and returns total', async () => {
    const res = await GET(makeReq('?limit=1&offset=0&sort=semver:desc'));
    const json = (await res.json()) as ReleaseListResponse;
    expect(json.items.length).toBeLessThanOrEqual(1);
    expect(json.page.total).toBe(rows.length);
    expect(json.page.sort).toBe('semver:desc');
  });

  it('filters by q', async () => {
    const res = await GET(makeReq('?q=__no_such_release__'));
    const json = (await res.json()) as ReleaseListResponse;
    expect(json.items.length).toBe(0);
    expect(json.page.total).toBe(0);
  });

  it('accepts custom sorting', async () => {
    const res = await GET(makeReq('?sort=created_at:asc&limit=1'));
    const json = (await res.json()) as ReleaseListResponse;
    expect(json.page.sort).toBe('created_at:asc');
  });
});
