import CollectionRelationships from "@/components/identity/CollectionRelationships";
import DataPageShell from "@/components/layout/DataPageShell";
import PageIntro from "@/components/layout/PageIntro";
import DirectoryReturnLink from "@/components/directory/DirectoryReturnLink";

import { SectionDivider } from "@/components/SectionDivider";
import RedditEmbed from "@/components/unclejimmy/RedditEmbed";
import SquadMemberPosts from "@/components/unclejimmy/SquadMemberPosts";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import {
  SHARED_OPEN_GRAPH_FIELDS,
  SHARED_TWITTER_FIELDS,
} from "@/lib/seo/constants";
import { getIdentityTaggedPosts } from "@/lib/identity-chronicles";

const pageTitle = "bonnibel | 🎙unclejimmy squad";
const pageDescription =
  "Bonnibel is the OG seed from 🎙unclejimmy squad. As such, she's being gifted the first dedicated page for any member of squad.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl("unclejimmy/squad/bonnibel") },
  openGraph: {
    ...SHARED_OPEN_GRAPH_FIELDS,
    title: pageTitle,
    description: pageDescription,
    url: "/unclejimmy/squad/bonnibel",
    type: "website",
  },
  twitter: {
    ...SHARED_TWITTER_FIELDS,
    title: pageTitle,
    description: pageDescription,
  },
};

export default async function UncleJimmySquadBonnibelPage() {
  const taggedPosts = await getIdentityTaggedPosts(["bonnibel"]);

  return (
    <DataPageShell width="wide">
      <div className="space-y-8">
        <PageIntro eyebrow="unclejimmy · Fam" title="bonnibel" />
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          <i>bonnibel</i> is the OG seed from 🎙<i>unclejimmy</i>&rsquo;s squad.
          As such, she&rsquo;s being gifted the first dedicated page for any
          member of squad.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Keep scrolling to see all content. There&rsquo;s more to come soon!
        </p>
        <p>
          <DirectoryReturnLink
            directory="/unclejimmy/squad"
            alternatives={["/unclejimmy/fam"]}
            className="text-[16px] md:text-[18px] underline hover:no-underline"
          >
            ← Back to directory
          </DirectoryReturnLink>
        </p>
      </div>
      <SectionDivider className="my-6" />
      <nav aria-label="On this page" className="flex flex-wrap gap-3">
        <a className="link-blue" href="#family-story">
          Personal story
        </a>
        <a className="link-blue" href="#family-collections">
          Collections
        </a>
        <a className="link-blue" href="#family-chronicles">
          Chronicles
        </a>
      </nav>
      <section
        id="family-story"
        aria-label="Personal story"
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          lost series
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          For xmas 2024, I made a special series of paintings for the kiddos,
          titled <i>lost</i>, and we&rsquo;re going to share some content around{" "}
          <i>bonnibel</i>
          &rsquo;s painting to begin. Let&rsquo;s start with the OG reddit post:
        </p>
        <div className="rounded-lg border border-border bg-white p-2 shadow-sm">
          <RedditEmbed
            permalink="/r/runthejewels/comments/1hlavdr/live_from_the_garden/"
            subreddit="runthejewels"
            height={739}
          />
        </div>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          If you have a reddit account, be sure to upvote and comment on the
          original post to show some love! If you don&rsquo;t have a reddit
          account, create a burner at least. 😉
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Next up, I wrote a performance piece to go along with the painting
          that I performed during last year&rsquo;s xmas party. Let&rsquo;s see
          if I can dig up her specific script:
        </p>
        <div className="rounded-lg border border-border bg-white p-2 shadow-sm">
          <iframe
            src="https://docs.google.com/document/d/1QHQEp1JY0_B4M1gmEejDzJWc_FLINwE3ImcHRChQ4Pc/preview"
            title="bonnibel document"
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
      </section>
      <SectionDivider className="my-6" />
      <div id="family-collections" className="scroll-mt-24">
        <CollectionRelationships
          slug="bonnibel"
          displayName="bonnibel"
          mode="person"
        />
      </div>
      <div id="family-chronicles" className="scroll-mt-24">
        <SquadMemberPosts tag="bonnibel" posts={taggedPosts} />
      </div>
    </DataPageShell>
  );
}
