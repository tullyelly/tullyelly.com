import Link from "next/link";

import { fmtDate } from "@/lib/datetime";
import {
  getLandingReleaseEntries,
  releaseSectionPreview,
} from "@/lib/alter-ego-release-content";
import {
  getPersonaReleaseLogHref,
  PERSONA_RELEASE_FEEDS,
  type PersonaReleaseFeed as Persona,
} from "@/lib/persona-release-feeds";

export default function PersonaReleaseFeed({ persona }: { persona: Persona }) {
  const entries = getLandingReleaseEntries(persona);
  const config = PERSONA_RELEASE_FEEDS[persona];

  return (
    <section className="space-y-4" aria-labelledby={`${persona}-latest-releases`}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 id={`${persona}-latest-releases`} className="text-xl font-semibold leading-snug md:text-2xl">
          latest releases
        </h1>
        <Link href={getPersonaReleaseLogHref(persona)} className="link-blue text-sm md:text-base">
          all {config.label} →
        </Link>
      </div>
      {entries.length === 0 ? (
        <p className="text-[16px] text-muted-foreground">No releases have landed here yet.</p>
      ) : (
        <ol className="grid gap-3">
          {entries.map((entry) => (
            <li key={`${entry.postSlug}-${entry.sectionOrdinal}`} className="rounded-xl border border-border/70 p-4">
              <p className="text-sm text-muted-foreground">{fmtDate(entry.postDate)}</p>
              <h2 className="font-semibold leading-snug">
                <Link href={entry.postUrl} className="link-blue">{entry.postTitle}</Link>
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {releaseSectionPreview(entry.bodyMdx) || "Open the chronicle to view this release."}
              </p>
              <Link href={entry.postUrl} className="mt-2 inline-block text-sm link-blue" aria-label={`Open original chronicle: ${entry.postTitle}`}>
                open original chronicle →
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
