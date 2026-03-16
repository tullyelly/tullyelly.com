"use client";

import { useCallback, useEffect, useState } from "react";
import { SectionDivider } from "@/components/SectionDivider";
import { fmtDateTime } from "@/lib/datetime";
import { Card } from "@ui";

type TagComment = {
  id: string;
  body: string;
  created_at: string;
  user_name: string;
};

type Props = {
  tag: string;
};

const PAGE_SIZE = 10;

function CommentCard({ comment }: { comment: TagComment }) {
  return (
    <Card as="li" className="space-y-3 p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <span className="text-sm font-semibold text-foreground">
          {comment.user_name}
        </span>
        <span className="text-xs text-muted-foreground">
          {fmtDateTime(comment.created_at)}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {comment.body}
      </p>
    </Card>
  );
}

export function TagCommentsSection({ tag }: Props) {
  const [comments, setComments] = useState<TagComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchComments = useCallback(
    async (cursor?: string) => {
      const searchParams = new URLSearchParams({
        tag,
        limit: String(PAGE_SIZE),
      });

      if (cursor) {
        searchParams.set("cursor", cursor);
      }

      const res = await fetch(`/api/tag-comments?${searchParams.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch tag comments");
      }

      const data = (await res.json()) as TagComment[];
      return Array.isArray(data) ? data : [];
    },
    [tag],
  );

  useEffect(() => {
    let active = true;

    async function loadInitialComments() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchComments();
        if (!active) return;
        setComments(data);
        setHasMore(data.length === PAGE_SIZE);
      } catch {
        if (!active) return;
        setError("Failed to load community comments.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInitialComments();

    return () => {
      active = false;
    };
  }, [fetchComments]);

  async function handleLoadMore() {
    const cursor = comments.at(-1)?.created_at;
    if (!cursor) return;

    setLoadingMore(true);
    setError(null);

    try {
      const data = await fetchComments(cursor);
      setComments((current) => [...current, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      setError("Failed to load community comments.");
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) {
    return null;
  }

  if (!error && comments.length === 0) {
    return null;
  }

  return (
    <>
      <SectionDivider />

      <section className="space-y-5">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold">Community</h2>
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            Comments left by this identity across the chronicles.
          </p>
        </header>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="space-y-4">
            <ul className="space-y-4">
              {comments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </ul>

            {hasMore ? (
              <div className="flex justify-start">
                <button
                  type="button"
                  className="btn"
                  onClick={() => void handleLoadMore()}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </>
  );
}
