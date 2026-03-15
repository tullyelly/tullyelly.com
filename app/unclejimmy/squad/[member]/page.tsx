import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { SectionDivider } from "@/components/SectionDivider";
import SquadMemberPosts from "@/components/unclejimmy/SquadMemberPosts";
import { getCartoonByTagId } from "@/lib/cartoon/getCartoonByTagId";
import { getCommentsByUserId } from "@/lib/comments/getCommentsByUserId";
import {
  getSecretIdentitySquadMember,
  listDynamicSquadMemberParams,
} from "@/lib/unclejimmy/secretIdentitySquadMembers";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import { getTaggedPosts } from "@/lib/blog";
import { fmtDateTime } from "@/lib/datetime";

type Params = { member: string };

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getMemberDescription(displayName: string): string {
  return `Profile page for ${displayName} within the 🎙unclejimmy squad.`;
}

function getRecentChroniclesDescription(displayName: string, tagSlug: string) {
  return `Recent chronicle entries tied to ${displayName} under #${tagSlug.toLowerCase()}.`;
}

function truncateCommentBody(body: string, maxLength = 280): string {
  const trimmed = body.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 3).trimEnd()}...`;
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
  const comments = await getCommentsByUserId(member.userId);
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
          Cartoon
        </h2>
        {showCartoon && cartoon ? (
          <div className="space-y-4 rounded-lg border border-border bg-white p-4 shadow-sm md:p-6">
            <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-lg border border-border bg-white">
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
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-white p-4 shadow-sm md:p-6">
            <p className="text-[16px] md:text-[18px] text-muted-foreground">
              No cartoon uploaded yet.
            </p>
          </div>
        )}
      </section>
      <SectionDivider className="my-6" />
      <div className="rounded-lg border border-border bg-white p-4 shadow-sm md:p-6">
        <SquadMemberPosts
          tag={member.tagSlug}
          posts={taggedPosts}
          heading="Recent chronicles"
          description={getRecentChroniclesDescription(
            member.displayName,
            member.tagSlug,
          )}
        />
      </div>
      <SectionDivider className="my-6" />
      <section className="space-y-5">
        <header className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold leading-snug">
            Comments
          </h2>
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            Every comment {member.displayName} has left across the chronicles.
          </p>
        </header>

        {comments.length === 0 ? (
          <div className="rounded-lg border border-border bg-white p-4 shadow-sm md:p-6">
            <p className="text-[16px] md:text-[18px] text-muted-foreground">
              No comments yet.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="space-y-3 rounded-lg border border-border bg-white p-4 shadow-sm md:p-5"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <Link
                    href={`/shaolin/${encodeURIComponent(comment.postSlug)}`}
                    className="text-sm font-semibold link-blue"
                  >
                    {comment.postSlug}
                  </Link>
                  <time
                    dateTime={comment.createdAt}
                    className="text-xs text-muted-foreground"
                  >
                    {fmtDateTime(comment.createdAt)}
                  </time>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {truncateCommentBody(comment.body)}
                </p>
                <div>
                  <Link
                    href={`/shaolin/${encodeURIComponent(comment.postSlug)}`}
                    className="text-sm underline hover:no-underline"
                  >
                    View original post
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
