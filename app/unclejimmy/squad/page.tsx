import Link from "next/link";

import { canonicalUrl } from "@/lib/share/canonicalUrl";

const pageTitle = "🎙unclejimmy squad | tullyelly";
const pageDescription =
  "Holding area for future squad content inside the 🎙unclejimmy persona.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl("unclejimmy/squad") },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/unclejimmy/squad",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

export default function UncleJimmySquadPage() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          squad
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          This is early days on another idea. The 🎙unclejimmy squad will be
          unveiled over time. Baby steps.
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          nuclear reactor
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Primary sources of energy:
        </p>
        <ul className="list-disc list-inside pl-6 text-[16px] md:text-[18px] text-muted-foreground">
          <li>
            <Link
              href="/shaolin/tags/nikkigirl"
              className="underline hover:no-underline"
            >
              nikkigirl
            </Link>
          </li>
          <li>
            <Link
              href="/shaolin/tags/bonnibel"
              className="underline hover:no-underline"
            >
              bonnibel
            </Link>
          </li>
          <li>
            <Link
              href="/shaolin/tags/lulu"
              className="underline hover:no-underline"
            >
              lulu
            </Link>
          </li>
          <li>
            <Link
              href="/shaolin/tags/jeff-meff"
              className="underline hover:no-underline"
            >
              jeff-meff
            </Link>
          </li>
          <li>
            <Link
              href="/shaolin/tags/eeeeeeeemma"
              className="underline hover:no-underline"
            >
              eeeeeeeemma
            </Link>
          </li>
        </ul>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          coming soon....
        </h2>
        <ul className="list-disc list-inside pl-6 text-[16px] md:text-[18px] text-muted-foreground">
          <li>g-league</li>
          <li>bench mob</li>
          <li>key personnel</li>
        </ul>
      </section>
    </div>
  );
}
