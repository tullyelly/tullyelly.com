import Link from "next/link";
import { allPosts } from "contentlayer/generated";
import { notFound } from "next/navigation";
import { Card } from "@ui";
import FlowersInline from "@/components/flowers/FlowersInline";
import { ChronicleSignature } from "@/components/chronicles/ChronicleSignature";
import { ChroniclePostTailCards } from "@/components/chronicles/ChroniclePostTailCards";
import { ChroniclePrevNextNav } from "@/components/chronicles/ChroniclePrevNextNav";
import { CommentsSection } from "@/components/chronicles/CommentsSection";
import { MdxRenderer } from "@/components/mdx-renderer";
import { SectionDivider } from "@/components/SectionDivider";
import { fmtDate } from "@/lib/datetime";

type Params = { slug: string };

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    <div className="-mx-2 md:mx-0">
      <article className="w-full max-w-none md:max-w-3xl md:mx-auto space-y-10 mt-8 md:mt-10">
        <Card
          as="section"
          className="space-y-6 border-0 shadow-none px-1 py-6 md:p-8"
        >
          <header className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
              {fmtDate(post.date)}
              {`: ${post.title}`}
            </h1>
          </header>
          <div className="space-y-4">
            <MdxRenderer code={post.body.code} />
            <ChronicleSignature
              title={post.title}
              date={post.date}
              summary={post.summary}
              tags={post.tags}
            />
            <ChroniclePrevNextNav slug={post.slug} />
          </div>
        </Card>

        <CommentsSection postSlug={post.slug} />

        <SectionDivider />

        <ChroniclePostTailCards />

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
    </div>
  );
}
