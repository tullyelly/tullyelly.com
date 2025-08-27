import type { ReleaseListResponse, ReleaseListItem } from '@/types/releases';

const rows: ReleaseListItem[] = [
  {
    id: 1,
    release_name: 'Alpha',
    status: 'open',
    release_type: 'minor',
    created_at: new Date('2024-01-01').toISOString(),
    semver: '0.1.0',
  },
  {
    id: 2,
    release_name: 'Beta',
    status: 'closed',
    release_type: 'major',
    created_at: new Date('2024-02-01').toISOString(),
    semver: '1.0.0',
  },
];

jest.mock('@/db/pool', () => ({
  getPool: () => ({
    query: (sql: string, params: unknown[]) => {
      if (sql.includes('COUNT')) {
        const q = params[0] as string | undefined;
        return Promise.resolve({ rows: [{ total: q ? 0 : rows.length }] });
      }
      const hasQ = params.length === 3;
      const limit = params[params.length - 2] as number;
      const offset = params[params.length - 1] as number;
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
    const res = await GET(makeReq('?limit=1&offset=0&sort=created_at:desc'));
    const json = (await res.json()) as ReleaseListResponse;
    expect(json.items.length).toBeLessThanOrEqual(1);
    expect(json.page.total).toBe(rows.length);
    expect(json.page.sort).toBe('created_at:desc');
  });

  it('filters by q', async () => {
    const res = await GET(makeReq('?q=__no_such_release__'));
    const json = (await res.json()) as ReleaseListResponse;
    expect(json.items.length).toBe(0);
    expect(json.page.total).toBe(0);
  });

  it('accepts custom sorting', async () => {
    const res = await GET(makeReq('?sort=release_name:asc&limit=1'));
    const json = (await res.json()) as ReleaseListResponse;
    expect(json.page.sort).toBe('release_name:asc');
  });
});
