import { getReleases, ORDER_BY, type Sort, type ReleaseListResponse } from '@/lib/releases';
import { signSnapshot, stableStringify } from '@/lib/sig';
import type { Release } from './_components/ScrollsTable';
import ScrollsPageClient from './_components/ScrollsPageClient';
import HydrationCanary from './_components/HydrationCanary';
import ZoneCanary from '@/app/_diag/ZoneCanary';
import ActionBar from './_components/ActionBar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ limit?: string; offset?: string; sort?: string; q?: string }>;
}

function parseSearchParams(
  params: PageProps['searchParams'],
): Promise<{ limit: number; offset: number; sort: Sort; q?: string }> {
  return params.then((p = {}) => {
    const limitNum = Number.parseInt(p.limit ?? '', 10);
    const limit = Math.min(Math.max(Number.isNaN(limitNum) ? 20 : limitNum, 1), 100);

    const offsetNum = Number.parseInt(p.offset ?? '', 10);
    const offset = Math.max(Number.isNaN(offsetNum) ? 0 : offsetNum, 0);

    const sortRaw = p.sort ?? 'semver:desc';
    const sort = (sortRaw in ORDER_BY ? sortRaw : 'semver:desc') as Sort;

    const qVal = p.q ? p.q.trim() : undefined;

    return { limit, offset, sort, q: qVal };
  });
}

function parsePlannedDate(name: string) {
  const match = name.match(/\u2013\s*(\d{4}-\d{2})/);
  return match ? match[1] : '';
}

export default async function Page({ searchParams }: PageProps) {
  const { limit, offset, sort, q } = await parseSearchParams(searchParams);

  let data: ReleaseListResponse;
  try {
    data = await getReleases({ limit, offset, sort, q });
  } catch (err) {
    if (process.env.E2E_MODE === '1') {
      data = {
        items: [],
        page: { limit, offset, total: 0, sort, ...(q ? { q } : {}) },
      };
    } else {
      throw err;
    }
  }

  const releases: Release[] = data.items.map((item) => ({
    id: item.id,
    name: item.name,
    plannedDate: parsePlannedDate(item.name),
    status: item.status as Release['status'],
    type: item.type as Release['type'],
    semver: item.semver,
  }));

  const ssrPayload = { items: releases, page: data.page };
  const enabled = Boolean(process.env.NEXT_PUBLIC_HYDRATION_DIAG);
  const ssrSig = enabled ? signSnapshot(ssrPayload) : undefined;

  // Zone canary props
  const actionBarProps = { q: q ?? '' };
  const tableProps = { items: releases, page: data.page };
  const navProps = { brand: 'tullyelly' };
  const footerProps = {} as Record<string, never>;

  return (
    <section
      id="scrolls-root"
      className="flex min-h-screen flex-col gap-4"
      {...(ssrSig ? { 'data-ssr-sig': ssrSig } : {})}
    >
      <h1 className="text-xl font-semibold">Shaolin Scrolls</h1>
      <HydrationCanary initial={ssrPayload} enabled={enabled} />
      {/* Server-stable ActionBar with client-only upgrades mounted after hydrate */}
      <ActionBar q={q ?? ''} />
      {enabled && (
        <>
          <ZoneCanary
            id="action-zone"
            zone="ActionBar"
            enabled={enabled}
            ssrSignature={signSnapshot(stableStringify(actionBarProps))}
            ssrPropsJSON={stableStringify(actionBarProps)}
          />
          <ZoneCanary
            id="table-zone"
            zone="Table"
            enabled={enabled}
            ssrSignature={signSnapshot(stableStringify(tableProps))}
            ssrPropsJSON={stableStringify(tableProps)}
          />
        </>
      )}
      <ScrollsPageClient initialData={releases} />
    </section>
  );
}
