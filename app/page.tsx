import Link from "next/link";

import { getPublishedPosts } from "@/lib/blog";
import { fmtDate } from "@/lib/datetime";
import { MdxRenderer } from "@/components/mdx-renderer";

export const dynamic = "force-static";

export async function generateMetadata() {
  const posts = getPublishedPosts();
  const latest = posts[0];
  if (!latest) {
    return {
      title: "tullyelly; under construction",
      description: "Homepage is warming up. Visit chronicles while we build.",
    };
  }
  return {
    title: latest.title,
    description: latest.summary,
    alternates: { canonical: latest.canonical ?? undefined },
    openGraph: {
      title: latest.title,
      description: latest.summary,
      url: latest.url,
    },
  };
}

type Post = ReturnType<typeof getPublishedPosts>[number];

function LatestPost({ post }: { post: Post }) {
  return (
    <article className="prose max-w-3xl mx-auto py-8">
      <header className="mb-6">
        <h1>{post.title}</h1>
        <p className="text-sm opacity-70">{fmtDate(post.date)}</p>
      </header>
      <MdxRenderer code={post.body.code} />
    </article>
  );
}

export default function Page() {
  const posts = getPublishedPosts();
  const latest = posts[0];

  if (!latest) {
    return (
      <main className="max-w-3xl mx-auto py-24 space-y-6">
        <h1 className="text-2xl font-semibold">under construction</h1>
        <p>The homepage will feature the latest chronicle soon.</p>
        <Link href="/shaolin" className="underline">
          Browse chronicles →
        </Link>
      </main>
    );
  }

  return <LatestPost post={latest} />;
}
