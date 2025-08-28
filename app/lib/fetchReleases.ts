import { getBaseUrl } from './getBaseUrl';
import type { ReleaseListResponse, ReleaseRow } from '@/app/api/releases/route';

export async function fetchReleases(): Promise<ReleaseRow[]> {
  const base = getBaseUrl();
  const url = `${base}/api/releases`;

  console.log(
    JSON.stringify({
      tag: 'releases_fetch_begin',
      url,
      env: process.env.NODE_ENV,
      vercel_url: process.env.VERCEL_URL ?? null,
    })
  );

  const res = await fetch(url, {
    cache: 'no-store',
    next: { revalidate: 0 },
    headers: {
      'x-ssr-fetch': 'releases',
    },
  });

  if (!res.ok) {
    console.error(
      JSON.stringify({
        tag: 'releases_fetch_http_error',
        status: res.status,
        statusText: res.statusText,
        url,
      })
    );
    throw new Error(`Failed to fetch releases: ${res.status}`);
  }

  const json = (await res.json()) as ReleaseListResponse;

  if (!json || !Array.isArray(json.items)) {
    console.error(
      JSON.stringify({
        tag: 'releases_fetch_bad_payload',
        url,
        payloadKeys: json ? Object.keys(json) : null,
      })
    );
    throw new Error('Unexpected releases payload');
  }

  console.log(
    JSON.stringify({
      tag: 'releases_fetch_success',
      count: json.items.length,
    })
  );

  return json.items;
}

