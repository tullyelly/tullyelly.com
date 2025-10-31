import Link from "next/link";
import { allPosts } from "contentlayer/generated";
import { notFound } from "next/navigation";
import { Card } from "@ui";
import FlowersInline from "@/components/flowers/FlowersInline";
import { MdxRenderer } from "@/components/mdx-renderer";
import { SectionDivider } from "@/components/SectionDivider";
import { fmtDate } from "@/lib/datetime";

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
    <article className="max-w-3xl mx-auto space-y-10 mt-8 md:mt-10">
      <Card as="section" className="p-6 md:p-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            {post.title}
          </h1>
          <p className="text-sm text-muted-foreground">{fmtDate(post.date)}</p>
        </header>
        <div className="space-y-6">
          <MdxRenderer code={post.body.code} />
        </div>
      </Card>

      <SectionDivider />

      <footer className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          <FlowersInline>
            <a
              href="https://www.contentlayer.dev/"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contentlayer
            </a>
            {", "}
            <a
              href="https://tailwindcss.com/"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tailwind CSS
            </a>
            {" & "}
            <a
              href="https://nextjs.org/"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Next.js
            </a>
          </FlowersInline>
        </p>
        <Link href="/shaolin" className="link-blue">
          ← Back to chronicles
        </Link>
      </footer>
    </article>
  );
}
