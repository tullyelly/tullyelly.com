"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { fmtDateTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { SignInGate } from "@/components/auth/SignInGate";

type Comment = {
  id: number;
  post_slug: string;
  user_id: string;
  user_name: string;
  body: string;
  created_at: string;
};

type Props = {
  postSlug: string;
};

export function CommentsSection({ postSlug }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await fetch(
        `/api/comments?postSlug=${encodeURIComponent(postSlug)}`,
      );
      if (!res.ok) {
        throw new Error("Failed to fetch comments");
      }
      const data = (await res.json()) as Comment[];
      if (Array.isArray(data)) {
        setComments(data);
      } else {
        setComments([]);
      }
    } catch {
      setListError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [postSlug]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setMessage(null);

    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setFormError("Please enter a comment");
      return;
    }
    if (trimmedBody.length > 2000) {
      setFormError("Comment is too long");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postSlug, body: trimmedBody }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          data && typeof data.error === "string"
            ? data.error
            : res.status >= 500
              ? "Server error; try again."
              : "Failed to post comment";
        setFormError(message);
        return;
      }

      setBody("");
      setMessage("Comment posted.");
      await fetchComments();
    } catch {
      setFormError("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border-2 border-[var(--cream)] bg-white p-4 shadow-sm md:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Comments</h2>
        {message ? (
          <span className="text-sm text-emerald-700">{message}</span>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      ) : listError ? (
        <p className="text-sm text-destructive">{listError}</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-lg border border-border bg-muted/50 p-3"
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {comment.body}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {comment.user_name}
                </span>{" "}
                · {fmtDateTime(comment.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <SignInGate align="end">
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm font-medium" htmlFor="comment-body">
            Add a comment
          </label>
          <textarea
            id="comment-body"
            name="comment"
            className={cn(
              "min-h-[140px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={2000}
            placeholder="Share your thoughts..."
          />
          <div className="flex items-center gap-3">
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Posting..." : "Submit"}
            </button>
            {formError && (
              <span className="rounded bg-[#C41E3A] px-2 py-1 text-xs font-medium text-white shadow-sm">
                {formError}
              </span>
            )}
          </div>
        </form>
      </SignInGate>
    </section>
  );
}
