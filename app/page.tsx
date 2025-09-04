export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// no local Suspense usage; kept within child sections
import { ChroniclesSection } from '@/components/ChroniclesSection';
import { ShaolinScrollsSection } from '@/components/ShaolinScrollsSection';
import { MothersDaySection } from '@/components/MothersDaySection';
import { MusicalGuestsSection } from '@/components/MusicalGuestsSection';

export default function Home() {
  const chroniclesDate = '2025-09-03';
  const scrollsDate = '2025-09-01';
  const mothersDate = '2025-09-04';
  const musicalDate = '2025-09-04';
  return (
    <>
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <MusicalGuestsSection date={musicalDate} />
      <MothersDaySection date={mothersDate} />
      <ChroniclesSection date={chroniclesDate} />
      <ShaolinScrollsSection date={scrollsDate} />
    </>
  );
}
