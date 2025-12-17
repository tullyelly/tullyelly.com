export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// no local Suspense usage; kept within child sections
import Link from "next/link";

import { ChronicleSignature } from "@/components/chronicles/ChronicleSignature";
import { ChroniclePostTailCards } from "@/components/chronicles/ChroniclePostTailCards";
import { ChroniclesSection } from "@/components/ChroniclesSection";
import { FirstOffTheLineSection } from "@/components/FirstOffTheLineSection";
import { MdxRenderer } from "@/components/mdx-renderer";
import { MothersDaySection } from "@/components/MothersDaySection";
import { MusicalGuestsSection } from "@/components/MusicalGuestsSection";
import { SectionDivider } from "@/components/SectionDivider";
import { ShaolinScrollsSection } from "@/components/ShaolinScrollsSection";
import { getPublishedPosts } from "@/lib/blog";
import { fmtDate } from "@/lib/datetime";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

const pageTitle = "ruins | tullyelly";
const pageDescription =
  "Ideas have a way of dying off or being replaced; this graveyard keeps the OG homepage(s) alive until the next idea meets the same fate.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: canonicalUrl("tullyelly/ruins"),
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/tullyelly/ruins",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

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
      <div className="not-prose">
        <ChroniclePostTailCards />
      </div>
    </article>
  );
}

function HomepageRetiredSection() {
  const posts = getPublishedPosts();
  const latest = posts[0];

  return (
    <section className="space-y-8">
      <h2 className="text-3xl md:text-4xl font-semibold font-mono">
        ## 2025-12-06 Homepage 2.0 Retired
      </h2>
      {!latest ? (
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
      ) : (
        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold leading-snug">
              mic check, 1, 2, um, 12....
            </h2>
            <p className="text-[16px] md:text-[18px] text-muted-foreground">
              The homepage is currently under construction. Meanwhile, if you
              are new to the site, it is recommended you visit the 🧠mark2{" "}
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
              always be on the homepage as I figure out what I want this to
              evolve into.
            </p>
            <p className="text-[16px] md:text-[18px] text-muted-foreground">
              Hug ball.
            </p>
          </section>
          <LatestPost post={latest} />
        </div>
      )}
    </section>
  );
}

export default function Home() {
  return <RuinsContent />;
}

function RuinsContent() {
  const chroniclesDate = "2025-09-03";
  const scrollsDate = "2025-09-01";
  const mothersDate = "2025-09-04";
  const musicalDate = "2025-09-04";
  const firstOffDate = "2025-09-05";
  return (
    <>
      <header className="mb-10 space-y-3">
        <h1 className="text-4xl md:text-5xl font-semibold font-mono">ruins</h1>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Ideas have a way of dying off or being replaced. This will be their
          graveyard. For now it&apos;s a place to drop the OG homepage(s) and
          will evolve as other ideas meet the same fate.
        </p>
      </header>
      <SectionDivider />
      <HomepageRetiredSection />
      <SectionDivider />
      <h2 className="text-3xl md:text-4xl font-semibold font-mono">
        ]allow me to reintroduce myself[
      </h2>
      <FirstOffTheLineSection date={firstOffDate} />
      <SectionDivider />
      <MusicalGuestsSection date={musicalDate} />
      <SectionDivider />
      <MothersDaySection date={mothersDate} />
      <SectionDivider />
      <ChroniclesSection date={chroniclesDate} />
      <SectionDivider />
      <ShaolinScrollsSection date={scrollsDate} />
    </>
  );
}
