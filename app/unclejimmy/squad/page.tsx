import Link from "next/link";
import type { Route } from "next";

import { canonicalUrl } from "@/lib/share/canonicalUrl";
import { sql } from "@/lib/db";
import {
  getSquadPageContent,
  getSquadPageItemHref,
  type SquadPageSection,
} from "@/lib/unclejimmy/squadPageContent";

import SquadCommentaryChart from "./_components/SquadCommentaryChart";

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

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SecretIdentityCommentSummaryRow = {
  tag_slug: string | null;
  tag_name: string | null;
  comment_count: number | string;
};

function SquadContentSection({
  section,
}: {
  section: SquadPageSection | null;
}) {
  if (!section) {
    return null;
  }

  const linkClassName =
    section.sectionKey === "trackers"
      ? "link-blue"
      : "underline hover:no-underline";

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-semibold leading-snug">
        {section.title}
      </h2>
      {section.description ? (
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          {section.description}
        </p>
      ) : null}
      {section.items.length > 0 ? (
        <ul className="list-disc list-inside pl-6 text-[16px] md:text-[18px] text-muted-foreground">
          {section.items.map((item) => {
            const href = getSquadPageItemHref(item);
            return (
              <li key={item.slug}>
                {href ? (
                  <Link href={href as Route} className={linkClassName}>
                    {item.label}
                  </Link>
                ) : (
                  item.label
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

export default async function UncleJimmySquadPage() {
  const [commentaryRows, squadSections] = await Promise.all([
    sql<SecretIdentityCommentSummaryRow>`
      SELECT *
      FROM dojo.v_secret_identity_comment_summary;
    `,
    getSquadPageContent(),
  ]);

  const commentaryData = commentaryRows.map((row) => ({
    tag_name: row.tag_name ?? row.tag_slug ?? "No identity",
    comment_count: Number(row.comment_count),
  }));
  const squadSectionByKey = new Map(
    squadSections.map((section) => [section.sectionKey, section]),
  );

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
      <SquadContentSection
        section={squadSectionByKey.get("nuclear-reactor") ?? null}
      />
      <SquadContentSection
        section={squadSectionByKey.get("trackers") ?? null}
      />
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          Squad Commentary
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          This chart shows which identities are most active in the chronicles
          comment threads.
        </p>
        <SquadCommentaryChart rows={commentaryData} />
      </section>
      <SquadContentSection
        section={squadSectionByKey.get("coming-soon") ?? null}
      />
    </div>
  );
}
