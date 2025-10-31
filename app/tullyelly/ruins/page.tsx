export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// no local Suspense usage; kept within child sections
import { ChroniclesSection } from "@/components/ChroniclesSection";
import { ShaolinScrollsSection } from "@/components/ShaolinScrollsSection";
import { MothersDaySection } from "@/components/MothersDaySection";
import { MusicalGuestsSection } from "@/components/MusicalGuestsSection";
import { SectionDivider } from "@/components/SectionDivider";
import { FirstOffTheLineSection } from "@/components/FirstOffTheLineSection";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

const pageTitle = "ruins | tullyelly";
const pageDescription =
  "Ideas have a way of dying off or being replaced; this graveyard keeps the OG homepage alive until the next idea meets the same fate.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: canonicalUrl("tullyelly/ruins"),
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/tullyelly/ruins",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

export default function Home() {
  return <RuinsContent />;
}

function RuinsContent() {
  const chroniclesDate = "2025-09-03";
  const scrollsDate = "2025-09-01";
  const mothersDate = "2025-09-04";
  const musicalDate = "2025-09-04";
  const firstOffDate = "2025-09-05";
  return (
    <>
      <header className="mb-10 space-y-3">
        <h1 className="text-4xl md:text-5xl font-semibold font-mono">ruins</h1>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Ideas have a way of dying off or being replaced. This will be their
          graveyard. For now it&apos;s a place to drop the OG homepage and will
          evolve as other ideas meet the same fate.
        </p>
      </header>
      <h2 className="text-3xl md:text-4xl font-semibold font-mono">
        ]allow me to reintroduce myself[
      </h2>
      <FirstOffTheLineSection date={firstOffDate} />
      <SectionDivider />
      <MusicalGuestsSection date={musicalDate} />
      <SectionDivider />
      <MothersDaySection date={mothersDate} />
      <SectionDivider />
      <ChroniclesSection date={chroniclesDate} />
      <SectionDivider />
      <ShaolinScrollsSection date={scrollsDate} />
    </>
  );
}
