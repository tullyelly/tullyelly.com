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
import type { Metadata } from "next";
import { setBreadcrumb, type Crumb } from "@/lib/breadcrumb-registry";

const BREADCRUMB = [
  { label: "home", href: "/" },
  { label: "tullyelly", href: "/tullyelly" },
  { label: "ruins" },
] satisfies ReadonlyArray<Crumb>;

export const metadata: Metadata = {
  alternates: {
    canonical: "/tullyelly/ruins",
  },
};

export default function Home() {
  setBreadcrumb(BREADCRUMB);

  const chroniclesDate = "2025-09-03";
  const scrollsDate = "2025-09-01";
  const mothersDate = "2025-09-04";
  const musicalDate = "2025-09-04";
  const firstOffDate = "2025-09-05";
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-semibold font-mono">
        ]allow me to reintroduce myself[
      </h1>
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
