import Link from "next/link";

import { getPublishedPosts } from "@/lib/blog";
import { fmtDate } from "@/lib/datetime";

type Props = {
  slug: string;
};

export function ChroniclePrevNextNav({ slug }: Props) {
  const posts = getPublishedPosts();
  const idx = posts.findIndex((p) => p.slug === slug);

  if (idx === -1 || posts.length < 2) return null;

  const newer = idx > 0 ? posts[idx - 1] : undefined;
  const older = idx + 1 < posts.length ? posts[idx + 1] : undefined;

  return (
    <nav
      aria-label="Chronicle navigation"
      className="grid gap-2 text-sm sm:grid-cols-2"
    >
      {older ? (
        <Link
          href={`/shaolin/${older.slug}`}
          className="link-blue"
          prefetch={false}
        >
          ← Older: {older.title} · {fmtDate(older.date)}
        </Link>
      ) : (
        <div />
      )}
      {newer ? (
        <Link
          href={`/shaolin/${newer.slug}`}
          className="link-blue sm:text-right"
          prefetch={false}
        >
          Newer: {newer.title} · {fmtDate(newer.date)} →
        </Link>
      ) : null}
    </nav>
  );
}
