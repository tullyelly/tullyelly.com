import Link from "next/link";
import Image from "next/image";

import { SectionDivider } from "@/components/SectionDivider";
import RedditEmbed from "@/components/unclejimmy/RedditEmbed";
import SquadMemberPosts from "@/components/unclejimmy/SquadMemberPosts";
import { getTaggedPosts } from "@/lib/blog";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

const pageTitle = "jeff meff | 🎙unclejimmy squad";
const pageDescription =
  "jeff meff keeps the 🎙unclejimmy squad energy loud and fun; this page tracks his lost series notes and recent chronicles.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl("unclejimmy/squad/jeff-meff") },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/unclejimmy/squad/jeff-meff",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

export default function UncleJimmySquadJeffMeffPage() {
  const taggedPosts = getTaggedPosts("jeff-meff");

  return (
    <div className="space-y-10">
      <div className="space-y-8">
        <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
          jeff-meff
        </h1>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          <i>jeff meff</i> is the next dedicated page in 🎙<i>unclejimmy</i>&rsquo;s squad. He's the greatest teammate, always sporting a smile, might lose an occasional phone or two, and most importantly, our #1 living his best life guy. 
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          I hope to keep evolving his page as we grow together. Scroll through for the latest and greatest. 
        </p>
        <p>
          <Link
            href="/unclejimmy/squad"
            className="text-[16px] md:text-[18px] underline hover:no-underline"
          >
            ← back to squad
          </Link>
        </p>
      </div>
      <SectionDivider className="my-6" />
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          lost series
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          For xmas 2024, I made a special series of paintings for the kiddos,
          titled <i>lost</i>, and we&rsquo;re going to share some content around{" "}
          <i>jeff meff</i>
          &rsquo;s painting next. Let&rsquo;s start with the OG reddit post:
        </p>
        <div className="rounded-lg border border-border bg-white p-2 shadow-sm">
          <RedditEmbed
            permalink="/r/tylerthecreator/comments/1hla7n7/chromakopia/"
            subreddit="tylerthecreator"
            height={740}
          />
        </div>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          If you have a reddit account, be sure to upvote and comment on the
          original post to show some love! If you don&rsquo;t have a reddit
          account, create a burner at least. 😉
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Next up, I wrote a performance piece to go along with the painting
          that I performed during last year&rsquo;s xmas party. Here's mr. meff's specific script:
        </p>
        <div className="rounded-lg border border-border bg-white p-2 shadow-sm">
          <iframe
            src="https://docs.google.com/document/d/166haCo0TDXosPOp4qVVr6EoE0phSTCBOQ__DayjUTLU/preview"
            title="jeff meff document"
            className="h-[640px] w-full rounded-md border border-border"
            allow="autoplay"
          />
        </div>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          This is written in third person because <i>eeeeeeeemma</i> performed
          what I wrote. Eventually, I&rsquo;ll build the rest of this
          performance into the site as we keep iterating.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Stay tuned for more <i>lost</i> content coming soon!
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Here's us at the concert a few months later!
        </p>
        <Image
          src="/images/optimized/unclejimmy/squad/jeff-meff/chromakopia.webp"
          alt="jeff meff, bonnibel and unclejimmy at the concert"
          width={1280}
          height={964}
          className="w-full rounded-lg border border-border shadow-sm"
        />
      </section>
      <SectionDivider className="my-6" />
      <SquadMemberPosts tag="jeff-meff" posts={taggedPosts} />
    </div>
  );
}
