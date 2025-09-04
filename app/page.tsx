export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// no local Suspense usage; kept within child sections
import { ChroniclesSection } from '@/components/ChroniclesSection';
import { ShaolinScrollsSection } from '@/components/ShaolinScrollsSection';
import { MothersDaySection } from '@/components/MothersDaySection';

export default function Home() {
  const chroniclesDate = '2025-09-03';
  const scrollsDate = '2025-09-01';
  const mothersDate = '2025-09-04';
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <MothersDaySection date={mothersDate} />
      <ChroniclesSection date={chroniclesDate} />
      <ShaolinScrollsSection date={scrollsDate} />
    </main>
  );
}
