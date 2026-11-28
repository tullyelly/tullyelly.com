import { buildMetadata } from "@/lib/seo/builders";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import TagLink from "@/components/tags/TagLink";
import CratesDirectory from "@/components/theabbott/CratesDirectory";
import Link from "next/link";
import { allPosts } from "contentlayer/generated";

import DataPageShell from "@/components/layout/DataPageShell";
import PageIntro from "@/components/layout/PageIntro";
import { Card } from "@ui";
import { listIdentities } from "@/lib/identity-server";
import { collectCrateAppearances } from "@/lib/music/crates";
import { getTagMetadataBatch } from "@/lib/tags-server";

export default async function Page() {
  const appearances = collectCrateAppearances(allPosts);
  const artistSlugs = Array.from(
    new Set(
      appearances.flatMap((appearance) =>
        appearance.artistTag ? [appearance.artistTag] : [],
      ),
    ),
  );
  const [homies, clans, artistMetadata] = await Promise.all([
    listIdentities({ context: "theabbott", kind: "person" }),
    listIdentities({ context: "theabbott", kind: "group" }),
    getTagMetadataBatch(artistSlugs),
  ]);
  const artistTags = artistSlugs.map(
    (slug) => [slug, artistMetadata.get(slug)?.displayName ?? slug] as const,
  );

  return (
    <DataPageShell width="wide">
      <PageIntro
        eyebrow="theabbott"
        title="The Crates"
        description="Explore songs, videos and playlists, then revisit the Chronicles where they appeared."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card as="section">
          <h2 className="text-xl font-semibold">Artists and groups</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {homies.length} Homies and {clans.length} Clans to explore. More
            artists and tags appear below.
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
      <CratesDirectory
        appearances={appearances}
        artistNames={Object.fromEntries(artistTags)}
      />
      {artistTags.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Artists and tags</h2>
          <ul className="flex flex-wrap gap-2">
            {artistTags.map(([slug, label]) => (
              <li key={slug}>
                <TagLink
                  tag={slug}
                  className="inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-sm link-blue"
                >
                  {label}
                </TagLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </DataPageShell>
  );
}

export const metadata = buildMetadata({
  title: "The Crates | tullyelly",
  description: "Discover albums, songs, artists and their source Chronicles.",
  canonical: canonicalUrl("theabbott/crates"),
});
