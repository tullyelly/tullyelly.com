import { allPosts } from "contentlayer/generated";
import { collectCrateAppearances } from "@/lib/music/crates";
import { canonicalTagSlug } from "@/lib/tag-aliases";
import { getTagAliasSnapshot } from "@/lib/tag-aliases-server";
import { getTagMetadataBatch } from "@/lib/tags-server";
import CratesDirectory from "./CratesDirectory";

export default async function IdentityMusic({ slug }: { slug: string }) {
  const aliases = await getTagAliasSnapshot();
  const canonical = canonicalTagSlug(slug, aliases);
  const appearances = collectCrateAppearances(allPosts).filter(
    (row) =>
      row.artistTag && canonicalTagSlug(row.artistTag, aliases) === canonical,
  );
  const metadata = await getTagMetadataBatch(
    appearances.flatMap((row) => (row.artistTag ? [row.artistTag] : [])),
  );
  return (
    <CratesDirectory
      appearances={appearances}
      artistNames={Object.fromEntries(
        [...metadata].map(([tag, value]) => [tag, value.displayName ?? tag]),
      )}
    />
  );
}
