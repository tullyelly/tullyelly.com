import type { Route } from "next";
import Link from "next/link";
import { allPosts } from "contentlayer/generated";

import DataPageShell from "@/components/layout/DataPageShell";
import SectionHeader from "@/components/layout/SectionHeader";
import { Card } from "@ui";
import { listIdentities } from "@/lib/identity-server";
import { collectCrateAppearances } from "@/lib/music/crates";

export default async function Page() {
  const [homies, clans] = await Promise.all([
    listIdentities({ context: "theabbott", kind: "person" }),
    listIdentities({ context: "theabbott", kind: "group" }),
  ]);
  const appearances = collectCrateAppearances(allPosts);
  const artistTags = Array.from(
    new Map(
      appearances.flatMap((appearance) =>
        appearance.artistTag
          ? [
              [
                appearance.artistTag,
                appearance.artist ?? appearance.artistTag,
              ] as const,
            ]
          : [],
      ),
    ),
  );

  return (
    <DataPageShell width="wide">
      <SectionHeader
        eyebrow="theabbott"
        title="The Crates"
        description="Music discoveries generated from Chronicle videos, songs, playlists, and their original appearances."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card as="section">
          <h2 className="text-xl font-semibold">Identity archive</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {homies.length} Homies and {clans.length} Clans are explicitly
            classified. Unclassified artist tags remain visible below.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/theabbott/homies" className="btn">
              Browse Homies
            </Link>
            <Link href="/theabbott/clans" className="btn">
              Browse Clans
            </Link>
          </div>
        </Card>
        <Card as="section">
          <h2 className="text-xl font-semibold">Dedicated collections</h2>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/theabbott/heels-have-eyes" className="link-blue">
                Heels Have Eyes
              </Link>
            </li>
            <li>
              <Link href="/theabbott/roadwork-rappin" className="link-blue">
                Roadwork Rappin
              </Link>
            </li>
          </ul>
        </Card>
      </div>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Recent appearances</h2>
        {appearances.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {appearances.map((appearance) => (
              <li
                key={`${appearance.chronicleUrl}-${appearance.type}-${appearance.id ?? appearance.url}-${appearance.artistTag ?? ""}-${appearance.song ?? appearance.title ?? ""}`}
              >
                <Card as="article" className="h-full">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {appearance.type}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">
                    {appearance.song ??
                      appearance.title ??
                      appearance.album ??
                      appearance.artist ??
                      appearance.id ??
                      "Music appearance"}
                  </h3>
                  {appearance.artist ? (
                    <p className="mt-1 text-sm">{appearance.artist}</p>
                  ) : null}
                  <Link
                    href={appearance.chronicleUrl as Route}
                    className="mt-4 inline-block link-blue"
                  >
                    {appearance.chronicleTitle}
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <Card as="p" className="text-muted-foreground">
            No theabbott music appearances have been inferred yet.
          </Card>
        )}
      </section>
      {artistTags.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Artists and tags</h2>
          <ul className="flex flex-wrap gap-2">
            {artistTags.map(([slug, label]) => (
              <li key={slug}>
                <Link
                  href={`/shaolin/tags/${encodeURIComponent(slug)}`}
                  className="inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-sm link-blue"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </DataPageShell>
  );
}
