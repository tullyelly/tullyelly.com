import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { SectionDivider } from "@/components/SectionDivider";
import SquadMemberPosts from "@/components/unclejimmy/SquadMemberPosts";
import { getCartoonByTagId } from "@/lib/cartoon/getCartoonByTagId";
import {
  getSecretIdentitySquadMember,
  listDynamicSquadMemberParams,
} from "@/lib/unclejimmy/secretIdentitySquadMembers";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import { getTaggedPosts } from "@/lib/blog";

type Params = { member: string };

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getMemberDescription(displayName: string): string {
  return `Profile page for ${displayName} within the 🎙unclejimmy squad.`;
}

export async function generateStaticParams(): Promise<Params[]> {
  return listDynamicSquadMemberParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { member: memberSlug } = await params;
  const member = await getSecretIdentitySquadMember(memberSlug);
  const displayName = member?.displayName ?? memberSlug;
  const canonicalMemberSlug = member?.tagSlug ?? memberSlug;
  const title = `${displayName} | 🎙unclejimmy squad`;
  const description = getMemberDescription(displayName);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(`unclejimmy/squad/${canonicalMemberSlug}`),
    },
    openGraph: {
      title,
      description,
      url: `/unclejimmy/squad/${canonicalMemberSlug}`,
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
  const member = await getSecretIdentitySquadMember(memberSlug);

  if (!member) {
    notFound();
  }

  const cartoon = await getCartoonByTagId(member.tagId);
  const taggedPosts = getTaggedPosts(member.tagSlug);
  const showCartoon =
    cartoon?.imagePath.toLowerCase().includes("cartoon") ?? false;

  return (
    <div className="space-y-10">
      <div className="space-y-8">
        <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
          {member.displayName}
        </h1>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          {getMemberDescription(member.displayName)}
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
          cartoon portrait
        </h2>
        {showCartoon && cartoon ? (
          <>
            <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-border bg-white shadow-sm aspect-[4/5]">
              <Image
                src={cartoon.imagePath}
                alt={`${member.displayName} cartoon portrait`}
                fill
                sizes="(max-width: 768px) 100vw, 28rem"
                className="object-contain"
              />
            </div>
            {cartoon.description ? (
              <p className="text-[16px] md:text-[18px] text-muted-foreground">
                {cartoon.description}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            No cartoon uploaded yet.
          </p>
        )}
      </section>
      <SectionDivider className="my-6" />
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          squad notes
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Quick notes and future updates for {member.displayName}; this space
          will collect small moments before they grow into full entries.
        </p>
      </section>
      <SectionDivider className="my-6" />
      <SquadMemberPosts tag={member.tagSlug} posts={taggedPosts} />
    </div>
  );
}
