"use client";

import { useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import Link from "next/link";

import { fmtDate } from "@/lib/datetime";
import type { TaggedPost } from "@/lib/blog";

type SquadMemberPostsProps = {
  tag: string;
  posts: TaggedPost[];
  pageSize?: number;
};

export default function SquadMemberPosts({
  tag,
  posts,
  pageSize = 10,
}: SquadMemberPostsProps) {
  const safeSize = Number.isFinite(pageSize) ? Math.max(1, pageSize) : 10;
  const totalPages = Math.max(1, Math.ceil((posts?.length ?? 0) / safeSize));
  const [page, setPage] = useState(1);
  const hasPosts = Array.isArray(posts) && posts.length > 0;

  useEffect(() => {
    setPage(1);
  }, [tag, safeSize, posts]);

  const pageItems = useMemo(() => {
    if (!Array.isArray(posts) || posts.length === 0) return [];
    const start = (page - 1) * safeSize;
    return posts.slice(start, start + safeSize);
  }, [posts, page, safeSize]);

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          recent chronicles for {tag.toLowerCase()}
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Latest entries tagged {tag.toLowerCase()}; browse without leaving this
          page.
        </p>
      </header>

      {hasPosts ? (
        <>
          <ul className="space-y-4">
            {pageItems.map((post) => (
              <li
                key={post.slug}
                className="rounded-xl border border-border/60 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <h3 className="text-lg md:text-xl font-semibold leading-snug">
                      <Link href={post.url as Route} className="link-blue">
                        {post.title}
                      </Link>
                    </h3>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {fmtDate(post.date)}
                    </span>
                  </div>
                  <p className="text-[16px] md:text-[18px] text-muted-foreground">
                    {post.summary}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1}
                className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                ← Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page >= totalPages}
                className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          No chronicles are tagged {tag.toLowerCase()} yet.
        </p>
      )}
    </section>
  );
}
