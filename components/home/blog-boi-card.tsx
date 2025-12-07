import Link from "next/link";

import { CardInfoPopover } from "@/components/home/card-info-popover";
import { homeCardRowClassName } from "@/components/home/home-card-row";
import { HomeCard } from "@/components/home/home-card";
import { fmtDate } from "@/lib/datetime";
import { getRecentBlogPosts, type RecentBlogPost } from "@/lib/blog";

export async function BlogBoiCard() {
  const posts: RecentBlogPost[] = await getRecentBlogPosts(5);
  const postsWithDate = posts.map((post) => ({
    ...post,
    publishedLabel: fmtDate(post.publishedAt),
  }));

  const info = (
    <CardInfoPopover ariaLabel="About the blog">
      <p className="m-0">
        The goal is to write a chronicle every day for at least a year; you
        never know who might show up along the way.
      </p>
      <p className="m-0 mt-2">
        These are the five most recent chronicles. If you want to try my wu-tang
        style, let us begin.
      </p>
    </CardInfoPopover>
  );

  return (
    <HomeCard title="Blog Boi" info={info}>
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No posts yet; the dojo is still warming up.
        </p>
      ) : (
        postsWithDate.map((post) => (
          <Link
            key={post.slug}
            href={`/shaolin/${post.slug}`}
            className={homeCardRowClassName(
              "flex items-baseline justify-between gap-2",
            )}
          >
            <span className="truncate">{post.title}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {post.publishedLabel}
            </span>
          </Link>
        ))
      )}
    </HomeCard>
  );
}
