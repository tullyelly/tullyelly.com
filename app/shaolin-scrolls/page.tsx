import ActionBar from './_components/ActionBar';
import ScrollsPageClient from './_components/ScrollsPageClient';
import FlowersInline from '@/components/flowers/FlowersInline';
import { getScrollsPage } from '@/lib/scrolls';
import type { Sort } from '@/lib/releases';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ q?: string; offset?: string; sort?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const parsed = await searchParams.then((p = {}) => {
    const sort: Sort = p.sort === 'semver:asc' ? 'semver:asc' : 'semver:desc';
    return {
      q: p.q?.trim() || '',
      offset: Number.isFinite(Number(p.offset)) ? Math.max(0, Number(p.offset)) : 0,
      sort,
    };
  });
  const { q, offset, sort } = parsed;
  const { items } = await getScrollsPage({ limit: 20, offset, sort, q: q || undefined });
  const rows = items.map((item) => ({
    id: Number(item.id),
    label: item.label,
    status: item.status,
    type: item.type,
    releaseDate: item.release_date,
  }));
  return (
    <section id="scrolls-root" className="flex min-h-screen flex-col gap-4">
      <h1 className="text-xl font-semibold">Shaolin Scrolls</h1>
      <ActionBar q={q} />
      <p className="text-sm md:text-[15px] text-muted-foreground">
        <FlowersInline>
          Chronicles wiki &{' '}
          <a
            href="https://dragonlance.fandom.com/wiki/Raistlin_Majere"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Raistlin Majere
          </a>
        </FlowersInline>
      </p>
      <ScrollsPageClient rows={rows} />
      <p className="text-sm md:text-[15px] text-muted-foreground">
        <FlowersInline>
          <a
            href="https://www.postgresql.org/"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            PostgreSQL
          </a>
          {', '}
          <a
            href="https://neon.tech/"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Neon
          </a>
          {' & '}
          <a
            href="https://www.jetbrains.com/datagrip/"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            DataGrip
          </a>
          {'; rekindled my database crush.'}
        </FlowersInline>
      </p>
    </section>
  );
}
