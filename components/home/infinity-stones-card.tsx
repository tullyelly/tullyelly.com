import Link from "next/link";

import { CardInfoPopover } from "@/components/home/card-info-popover";
import { HomeCard } from "@/components/home/home-card";
import { fmtDate } from "@/lib/datetime";
import { getInfinityStonePosts, type RecentBlogPost } from "@/lib/blog";

export async function InfinityStonesCard() {
  const posts: RecentBlogPost[] = await getInfinityStonePosts();
  const postsWithDate = posts.map((post) => ({
    ...post,
    publishedLabel: fmtDate(post.publishedAt),
  }));

  const info = (
    <CardInfoPopover ariaLabel="About Infinity Stones">
      <p className="m-0">
        Chronicles marked as Infinity Stones show up here; I set them aside as
        special keeps. As of now there are only 5 stones, and they represent my
        current <i>favorite</i> chronicles for one reason or another.
      </p>
      <p className="m-0 mt-2">
        Click a title to revisit any stone that has been placed. These may
        evolve alongside the multiverse.
      </p>
    </CardInfoPopover>
  );

  return (
    <HomeCard title="Infinity Stones" info={info}>
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No Infinity Stones yet; mark a chronicle to see it here.
        </p>
      ) : (
        postsWithDate.map((post) => (
          <Link
            key={post.slug}
            href={`/shaolin/${post.slug}`}
            className="block"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate">{post.title}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {post.publishedLabel}
              </span>
            </div>
          </Link>
        ))
      )}
    </HomeCard>
  );
}
