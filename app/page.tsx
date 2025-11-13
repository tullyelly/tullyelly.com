import Link from "next/link";

import { getPublishedPosts } from "@/lib/blog";
import { fmtDate } from "@/lib/datetime";
import { MdxRenderer } from "@/components/mdx-renderer";
import { ChronicleSignature } from "@/components/chronicles/ChronicleSignature";

// Home references shared header/menu; keep runtime to avoid test stub during build.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

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
    <article className="prose max-w-3xl mx-auto py-8 space-y-6">
      <header className="space-y-2">
        <h1>{post.title}</h1>
        <p className="text-sm opacity-70">{fmtDate(post.date)}</p>
      </header>
      <div className="space-y-4">
        <MdxRenderer code={post.body.code} />
        <ChronicleSignature
          title={post.title}
          date={post.date}
          summary={post.summary}
          tags={post.tags}
        />
      </div>
    </article>
  );
}

export default function Page() {
  const posts = getPublishedPosts();
  const latest = posts[0];

  if (!latest) {
    return (
      <div className="space-y-4 py-24">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          under construction
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          The homepage will feature the latest chronicle soon.
        </p>
        <Link href="/shaolin" className="link-blue text-sm font-medium">
          Browse chronicles →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          mic check, 1, 2, um, 12....
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          The homepage is currently under construction. Meanwhile, if you are
          new to the site, it is recommended you visit the 🧠mark2{" "}
          <Link href="/mark2" className="underline hover:no-underline">
            blueprint
          </Link>{" "}
          landing page to begin your journey. Maybe I&apos;ll call the{" "}
          <Link
            href="/theabbott/roadwork-rappin"
            className="underline hover:no-underline"
          >
            roadwork rappin&#39;
          </Link>{" "}
          bois to help me build the homepage.😉
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Raistlin had his spellbook, I have{" "}
          <Link href="/shaolin" className="underline hover:no-underline">
            shaolin chronicles
          </Link>
          . If that&#39;s too much magic for you, the latest chronicle will
          always be on the homepage as I figure out what I want this to evolve
          into.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Hug ball.
        </p>
      </section>
      <LatestPost post={latest} />
    </div>
  );
}
