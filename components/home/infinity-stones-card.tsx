import type { Route } from "next";

import { CardInfoPopover } from "@/components/home/card-info-popover";
import {
  HomeCardRowLink,
  HomeCardRowSpinner,
  HomeCardRows,
} from "@/components/home/home-card-row";
import { HomeCard } from "@/components/home/home-card";
import { fmtDate } from "@/lib/datetime";
import { getInfinityStonePosts, type RecentBlogPost } from "@/lib/blog";

export async function InfinityStonesCard() {
  const posts: RecentBlogPost[] = await getInfinityStonePosts();
  const postsWithDate = posts.map((post) => ({
    ...post,
    publishedLabel: fmtDate(post.publishedAt),
    href: `/shaolin/${post.slug}` as Route,
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
        <HomeCardRows>
          {postsWithDate.map((post) => (
            <HomeCardRowLink
              key={post.slug}
              href={post.href}
              className="flex items-baseline gap-2"
            >
              <span className="truncate">{post.title}</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {post.publishedLabel}
                </span>
                <HomeCardRowSpinner />
              </div>
            </HomeCardRowLink>
          ))}
        </HomeCardRows>
      )}
    </HomeCard>
  );
}
