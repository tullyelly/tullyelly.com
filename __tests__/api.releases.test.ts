import { GET } from '@/app/api/releases/route';
import type { ReleaseListResponse } from '@/types/releases';

function makeReq(query = '') {
  return new Request(`http://localhost/api/releases${query}`);
}

describe('/api/releases', () => {
  it('respects limit/offset and returns total', async () => {
    const res = await GET(makeReq('?limit=1&offset=0&sort=created_at:desc'));
    const json = (await res.json()) as ReleaseListResponse;
    expect(json.items.length).toBeLessThanOrEqual(1);
    expect(json.page.total).toBeGreaterThanOrEqual(json.items.length);
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
