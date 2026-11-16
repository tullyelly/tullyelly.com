import "server-only";
import { getTaggedPostsForTags } from "@/lib/blog";
import { listEquivalentTagSlugs } from "@/lib/tag-aliases-server";

/** Existing membership callers supply their own inherited tags; motivations never enter here. */
export async function getIdentityTaggedPosts(tags: readonly string[]) {
  return getTaggedPostsForTags(await listEquivalentTagSlugs(tags));
}
