import Link from "next/link";
import { notFound } from "next/navigation";

import DataPageShell from "@/components/layout/DataPageShell";
import SectionHeader from "@/components/layout/SectionHeader";
import SquadMemberPosts from "@/components/unclejimmy/SquadMemberPosts";
import { Card } from "@ui";
import { getTaggedPosts } from "@/lib/blog";
import type { IdentityContext, IdentityKind } from "@/lib/identity";
import {
  getIdentityBySlug,
  getIdentityHref,
  listGroupMembers,
  listIdentityGroups,
} from "@/lib/identity-server";

export default async function IdentityDetailPage({
  slug,
  context,
  kind,
  noun,
  directoryHref,
}: {
  slug: string;
  context: IdentityContext;
  kind: IdentityKind;
  noun: string;
  directoryHref: string;
}) {
  const identity = await getIdentityBySlug(slug);
  if (!identity || identity.metadata.kind !== kind) notFound();
  const related =
    kind === "person"
      ? await listIdentityGroups(identity.slug)
      : await listGroupMembers(identity.slug);
  const posts = getTaggedPosts(identity.slug);

  return (
    <DataPageShell width="wide">
      <SectionHeader
        eyebrow={`${context} ${noun}`}
        title={identity.displayName}
        description={`Shared identity #${identity.slug} in the ${context} context.`}
        actions={
          <Link href={directoryHref} className="btn">
            Back to {noun}s
          </Link>
        }
      />
      <Card as="section">
        <h2 className="text-xl font-semibold">
          {kind === "person" ? "Clans and squads" : "Members"}
        </h2>
        {related.length > 0 ? (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {related.map((item) => {
              const href = getIdentityHref(item, context);
              return (
                <li key={item.id}>
                  {href ? (
                    <Link href={href} className="link-blue">
                      {item.displayName}
                    </Link>
                  ) : (
                    item.displayName
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-muted-foreground">
            No relationships are recorded yet.
          </p>
        )}
      </Card>
      <SquadMemberPosts tag={identity.slug} posts={posts} />
    </DataPageShell>
  );
}
