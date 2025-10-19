import { allPosts } from "contentlayer/generated";
import { notFound } from "next/navigation";
import { fmtDate } from "@/lib/datetime";
import { MdxRenderer } from "@/components/mdx-renderer";

type Params = { slug: string };

export async function generateStaticParams() {
  return allPosts.filter((p) => !p.draft).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = allPosts.find((p) => p.slug === slug && !p.draft);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: post.canonical ?? undefined },
    openGraph: { title: post.title, description: post.summary },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return <PostContent slug={slug} />;
}

function PostContent({ slug }: { slug: string }) {
  const post = allPosts.find((p) => p.slug === slug && !p.draft);
  if (!post) notFound();
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
