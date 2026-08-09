import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import FullBleedPage from "@/components/layout/FullBleedPage";
import { fmtDate } from "@/lib/datetime";
import {
  getShaolinReleaseDetail,
  type ShaolinActivityType,
  type ShaolinReleaseActivity,
} from "@/lib/shaolin-release-detail";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = { params: Promise<{ id: string }> };

const sections: Array<{
  type: ShaolinActivityType;
  title: string;
}> = [
  { type: "chronicle", title: "Chronicles" },
  { type: "chronicle_amendment", title: "Chronicle Amendments" },
  { type: "tcdb_trade", title: "TCDb Trades Sent" },
  { type: "tcdb_trade", title: "TCDb Trades Received" },
  { type: "lcs_visit", title: "LCS Visits" },
  { type: "usps_visit", title: "USPS Visits" },
  { type: "review", title: "Reviews" },
  { type: "bricks_build", title: "Bricks Builds" },
  { type: "set_collector", title: "Set Collector Activity" },
];

function sectionItems(
  activity: ShaolinReleaseActivity[],
  section: (typeof sections)[number],
) {
  return activity.filter((item) => {
    if (item.type !== section.type) return false;
    if (section.title === "TCDb Trades Sent") return item.subtype === "sent";
    if (section.title === "TCDb Trades Received") {
      return item.subtype === "received";
    }
    return true;
  });
}

function metadataText(item: ShaolinReleaseActivity): string | null {
  const metadata = item.metadata;
  if (item.type === "tcdb_trade") {
    const pieces = [
      metadata.partner ? `Partner: ${metadata.partner}` : null,
      metadata.sent != null ? `Sent: ${metadata.sent}` : null,
      metadata.received != null ? `Received: ${metadata.received}` : null,
    ];
    return pieces.filter(Boolean).join("; ") || null;
  }
  if (item.type === "lcs_visit") {
    return [metadata.city, metadata.state].filter(Boolean).join(", ") || null;
  }
  if (item.type === "usps_visit") return String(metadata.state ?? "") || null;
  if (item.type === "review") {
    return (
      [metadata.reviewType, metadata.rating && `Rating: ${metadata.rating}`]
        .filter(Boolean)
        .join("; ") || null
    );
  }
  if (item.type === "bricks_build") {
    return metadata.bags ? `Bags: ${metadata.bags}` : null;
  }
  if (item.type === "set_collector") {
    return metadata.totalCards != null
      ? `${metadata.cardsOwned} of ${metadata.totalCards} cards`
      : null;
  }
  if (item.type === "chronicle") return String(metadata.summary ?? "") || null;
  if (item.type === "chronicle_amendment") {
    return "An amendment was published for this earlier Chronicle.";
  }
  return null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const release = await getShaolinReleaseDetail(id);
  if (!release) return { title: "Shaolin Scroll not found" };
  const date = release.releaseDate
    ? `released ${fmtDate(release.releaseDate)}`
    : "in progress";
  const title = `${release.semver}; ${release.label}`;
  const description = `${release.name}; ${release.status}; ${date}. Activity from ${fmtDate(release.activityStartDate)} through ${fmtDate(release.activityEndDate)}.`;
  const path = `/mark2/shaolin-scrolls/${release.id}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl(path.slice(1)) },
    openGraph: { title, description, url: path, type: "website" },
    twitter: { card: "summary", title, description },
    robots: { index: true },
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const release = await getShaolinReleaseDetail(id);
  if (!release) notFound();

  const windowDays =
    Math.round(
      (Date.parse(`${release.activityEndDate}T00:00:00Z`) -
        Date.parse(`${release.activityStartDate}T00:00:00Z`)) /
        86_400_000,
    ) + 1;

  return (
    <FullBleedPage articleClassName="md:max-w-[76rem] xl:max-w-[82rem]">
      <div className="space-y-8 px-1 py-6 md:px-2 md:py-8">
        <header className="overflow-hidden rounded-[28px] bg-[var(--blue)] text-white shadow-sm">
          <div className="space-y-6 px-4 py-5 md:px-7 md:py-7">
            <Link
              href="/mark2/shaolin-scrolls"
              className="inline-flex rounded-full border border-white bg-white px-3 py-1.5 text-sm font-semibold text-[var(--blue)] transition hover:bg-[var(--cream)]"
            >
              ← Back to Shaolin Scrolls
            </Link>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={getBadgeClass(release.status as never)}>
                  {release.status}
                </Badge>
                <Badge className={getBadgeClass(release.releaseType as never)}>
                  {release.releaseType}
                </Badge>
                {release.isInProgress ? (
                  <span className="rounded-full border border-white/40 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide">
                    In progress
                  </span>
                ) : null}
              </div>
              <h1 className="text-3xl font-bold leading-tight md:text-4xl">
                {release.label}
              </h1>
              <p className="font-mono text-lg text-white/85">
                {release.semver}
              </p>
            </div>
            <dl className="grid gap-px overflow-hidden rounded-xl border border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "Release",
                  release.releaseDate
                    ? fmtDate(release.releaseDate)
                    : "In progress",
                ],
                ["Activity begins", fmtDate(release.activityStartDate)],
                ["Activity ends", fmtDate(release.activityEndDate)],
                ["Window", `${windowDays} day${windowDays === 1 ? "" : "s"}`],
              ].map(([label, value]) => (
                <div key={label} className="bg-black/10 px-4 py-3.5">
                  <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/70">
                    {label}
                  </dt>
                  <dd className="mt-1.5 font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        <div className="space-y-10" data-testid="release-activity">
          {sections.map((section) => {
            const items = sectionItems(release.activity, section);
            if (items.length === 0) return null;
            return (
              <section
                key={section.title}
                aria-labelledby={`section-${section.title.replaceAll(" ", "-").toLowerCase()}`}
              >
                <h2
                  id={`section-${section.title.replaceAll(" ", "-").toLowerCase()}`}
                  className="mb-4 text-2xl font-semibold"
                >
                  {section.title}
                </h2>
                <ol className="grid gap-3 md:grid-cols-2">
                  {items.map((item) => {
                    const detail = metadataText(item);
                    return (
                      <li
                        key={`${item.type}:${item.sourceId}:${item.date}`}
                        className="rounded-2xl border border-[var(--border-subtle)] bg-white p-4 shadow-sm"
                      >
                        <time
                          className="text-xs font-semibold uppercase tracking-wide text-ink/60"
                          dateTime={item.date}
                        >
                          {fmtDate(item.date)}
                        </time>
                        <h3 className="mt-1 text-lg font-semibold">
                          {item.href ? (
                            <Link href={item.href} className="link-blue">
                              {item.title}
                            </Link>
                          ) : (
                            item.title
                          )}
                        </h3>
                        {detail ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {detail}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      </div>
    </FullBleedPage>
  );
}
