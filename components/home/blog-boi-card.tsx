import type { Route } from "next";

import { CardInfoPopover } from "@/components/home/card-info-popover";
import {
  HomeCardRowLink,
  HomeCardRowSpinner,
  HomeCardRows,
} from "@/components/home/home-card-row";
import { HomeCard } from "@/components/home/home-card";
import { fmtDate } from "@/lib/datetime";
import { getRecentBlogPosts, type RecentBlogPost } from "@/lib/blog";

export async function BlogBoiCard() {
  const posts: RecentBlogPost[] = await getRecentBlogPosts(5);
  const postsWithDate = posts.map((post) => ({
    ...post,
    publishedLabel: fmtDate(post.publishedAt),
    href: `/shaolin/${post.slug}` as Route,
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
