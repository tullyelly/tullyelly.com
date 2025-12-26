import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { SectionDivider } from "@/components/SectionDivider";
import SquadMemberPosts from "@/components/unclejimmy/SquadMemberPosts";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import { getTaggedPosts } from "@/lib/blog";
import { getSquadMember, squadMembers } from "@/lib/unclejimmy/squadMembers";

type Params = { member: string };

export function generateStaticParams(): Params[] {
  return squadMembers.map(({ slug }) => ({ member: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { member: memberSlug } = await params;
  const member = getSquadMember(memberSlug);
  const label = member?.label ?? memberSlug;
  const title = `${label} | 🎙unclejimmy squad`;
  const description =
    member?.blurb || `Profile page for ${label} within the 🎙unclejimmy squad.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(`unclejimmy/squad/${memberSlug}`),
    },
    openGraph: {
      title,
      description,
      url: `/unclejimmy/squad/${memberSlug}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { member: memberSlug } = await params;
  const member = getSquadMember(memberSlug);

  if (!member) {
    notFound();
  }

  const taggedPosts = getTaggedPosts(member.slug);

  return (
    <div className="space-y-10">
      <div className="space-y-8">
        <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
          {member.label}
        </h1>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          {member.blurb}
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
          squad notes
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Quick notes and future updates for {member.label}; this space will
          collect small moments before they grow into full entries.
        </p>
      </section>
      <SectionDivider className="my-6" />
      <SquadMemberPosts tag={member.label} posts={taggedPosts} />
    </div>
  );
}
