import type { Route } from "next";
import Link from "next/link";
import { allPosts } from "contentlayer/generated";
import { notFound } from "next/navigation";
import { getPublishedPosts, byDateDesc } from "@/lib/blog";
import { fmtDate } from "@/lib/datetime";

type Params = { tag: string };

export async function generateStaticParams() {
  const tags = new Set<string>();
  for (const p of allPosts) {
    if (p.draft) continue;
    for (const t of p.tags ?? []) tags.add(t.toLowerCase());
  }
  return Array.from(tags).map((t) => ({ tag: t }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { tag: rawTag } = await params;
  const tag = rawTag.toLowerCase();
  return {
    title: `#${tag} · chronicles`,
    description: `Posts tagged ${tag}`,
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { tag: rawTag } = await params;
  const tag = rawTag.toLowerCase();
  const posts = getPublishedPosts()
    .filter((p) => (p.tags ?? []).map((t) => t.toLowerCase()).includes(tag))
    .sort(byDateDesc);

  if (posts.length === 0) notFound();

  return (
    <main className="max-w-3xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-semibold">#{tag}</h1>
      <ul className="space-y-4">
        {posts.map((p) => (
          <li key={p.slug} className="border rounded-lg p-4">
            <h2 className="text-xl font-medium">
              <Link href={p.url as Route}>{p.title}</Link>
            </h2>
            <p className="text-sm opacity-70">{fmtDate(p.date)}</p>
            <p className="mt-2 opacity-90">{p.summary}</p>
          </li>
        ))}
      </ul>
      <div>
        <Link href={"/shaolin" as Route} className="underline">
          ← Back to chronicles
        </Link>
      </div>
    </main>
  );
}
