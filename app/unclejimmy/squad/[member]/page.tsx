import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { canonicalUrl } from "@/lib/share/canonicalUrl";
import { getSquadMember, squadMembers } from "@/lib/unclejimmy/squadMembers";

type Params = { member: string };

export function generateStaticParams(): Params[] {
  return squadMembers.map(({ slug }) => ({ member: slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const member = getSquadMember(params.member);
  const label = member?.label ?? params.member;
  const title = `${label} | 🎙unclejimmy squad`;
  const description =
    member?.blurb || `Profile page for ${label} within the 🎙unclejimmy squad.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(`unclejimmy/squad/${params.member}`),
    },
    openGraph: {
      title,
      description,
      url: `/unclejimmy/squad/${params.member}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function Page({ params }: { params: Params }) {
  const member = getSquadMember(params.member);

  if (!member) {
    notFound();
  }

  return (
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
  );
}
