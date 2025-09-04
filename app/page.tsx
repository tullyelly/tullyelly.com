export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// no local Suspense usage; kept within child sections
import { ChroniclesSection } from '@/components/ChroniclesSection';
import { ShaolinScrollsSection } from '@/components/ShaolinScrollsSection';

export default function Home() {
  const chroniclesDate = '2025-09-03';
  const scrollsDate = '2025-09-01';
  return (
    <main className="space-y-4">
      <h1 className="mt-0 text-2xl font-semibold">Welcome</h1>
      <ChroniclesSection date={chroniclesDate} />
      <ShaolinScrollsSection date={scrollsDate} />
    </main>
  );
}
