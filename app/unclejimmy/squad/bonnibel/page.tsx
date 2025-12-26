import Link from "next/link";

import { canonicalUrl } from "@/lib/share/canonicalUrl";

const pageTitle = "bonnibel | 🎙unclejimmy squad";
const pageDescription =
  "Holding spot for Bonnibel updates within the 🎙unclejimmy squad.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl("unclejimmy/squad/bonnibel") },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/unclejimmy/squad/bonnibel",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

export default function UncleJimmySquadBonnibelPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
        bonnibel
      </h1>
      <p className="text-[16px] md:text-[18px] text-muted-foreground">
        This page will share Bonnibel-specific details and squad memories; check
        back soon for more.
      </p>
      <p>
        <Link
          href="/unclejimmy/squad"
          className="text-[16px] md:text-[18px] underline hover:no-underline"
        >
          ← back to squad
        </Link>
      </p>
    </div>
  );
}
