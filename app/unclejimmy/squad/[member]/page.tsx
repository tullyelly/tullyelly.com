import Image from "next/image";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { SectionDivider } from "@/components/SectionDivider";
import { getCartoonByTagId } from "@/lib/cartoon/getCartoonByTagId";
import { getCommentsByUserId } from "@/lib/comments/getCommentsByUserId";
import {
  getSecretIdentitySquadMember,
} from "@/lib/unclejimmy/secretIdentitySquadMembers";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import { getTaggedPosts } from "@/lib/blog";
import { fmtDate, fmtDateTime } from "@/lib/datetime";

type Params = { member: string };

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getMemberDescription(displayName: string): string {
  return `Profile page for ${displayName} within the 🎙unclejimmy squad.`;
}

function truncateCommentBody(body: string, maxLength = 280): string {
  const trimmed = body.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 3).trimEnd()}...`;
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
  const spotlightPosts = taggedPosts.slice(0, 7);
  const comments = await getCommentsByUserId(member.userId);
  const showCartoon =
    cartoon?.imagePath.toLowerCase().includes("cartoon") ?? false;
  const tagPageHref =
    `/shaolin/tags/${encodeURIComponent(member.tagSlug)}` as Route;

  return (
    <div className="space-y-10">
      <div className="space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold italic leading-tight text-[var(--blue)]">
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
      <div className="grid gap-8 lg:min-h-[32rem] lg:grid-cols-2 lg:items-stretch">
        {showCartoon && cartoon ? (
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl lg:h-full lg:aspect-auto">
            <Image
              src={cartoon.imagePath}
              alt={`${member.displayName} cartoon portrait`}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-[3/2] items-center justify-center rounded-2xl bg-white text-[16px] md:text-[18px] text-muted-foreground lg:h-full lg:aspect-auto">
            No cartoon uploaded yet.
          </div>
        )}

        <section className="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-[var(--cream)] bg-white shadow-sm">
          <div className="flex items-center bg-[var(--green)] px-5 py-4 text-white">
            <h2 className="text-2xl font-semibold leading-none">
              {`${member.tagSlug}'s chronicles`}
            </h2>
          </div>
          {spotlightPosts.length > 0 ? (
            <ul className="flex flex-1 flex-col justify-between py-3">
              {spotlightPosts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={post.url as Route}
                    className="flex items-baseline gap-3 px-5 py-2 transition-colors hover:bg-[var(--cream)]"
                  >
                    <span className="truncate text-xl text-brand-greatLakesBlue underline decoration-current underline-offset-2">
                      {post.title}
                    </span>
                    <span className="ml-auto whitespace-nowrap text-base text-brand-greatLakesBlue underline decoration-current underline-offset-2">
                      {fmtDate(post.date)}
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={tagPageHref}
                  className="flex items-center px-5 py-2 text-xl text-brand-greatLakesBlue underline decoration-current underline-offset-2 transition-colors hover:bg-[var(--cream)]"
                >
                  View All
                </Link>
              </li>
            </ul>
          ) : (
            <div className="px-5 py-4 text-[16px] md:text-[18px] text-muted-foreground">
              No chronicles are tagged {member.tagSlug.toLowerCase()} yet.
            </div>
          )}
        </section>
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
