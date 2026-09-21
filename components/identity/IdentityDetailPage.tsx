import Link from "next/link";
import { notFound } from "next/navigation";

import DataPageShell from "@/components/layout/DataPageShell";
import SectionHeader from "@/components/layout/SectionHeader";
import RelatedIdentities from "@/components/identity/RelatedIdentities";
import SquadMemberPosts from "@/components/unclejimmy/SquadMemberPosts";
import { Card } from "@ui";
import { getTaggedPostsForTags } from "@/lib/blog";
import type { IdentityContext, IdentityKind } from "@/lib/identity";
import {
  getIdentityBySlug,
  listGroupMembers,
  listIdentityAncestorGroups,
  listIdentityDescendants,
  listIdentityGroups,
} from "@/lib/identity-server";

export default async function IdentityDetailPage({
  slug,
  context,
  kind,
  noun,
  directoryHref,
  directoryLabel,
}: {
  slug: string;
  context: IdentityContext;
  kind: IdentityKind;
  noun: string;
  directoryHref: string;
  directoryLabel: string;
}) {
  const identity = await getIdentityBySlug(slug);
  if (!identity || identity.metadata.kind !== kind) notFound();
  const [parentGroups, members, descendants] =
    kind === "person"
      ? [await listIdentityAncestorGroups(identity.slug), [], []]
      : await Promise.all([
          listIdentityGroups(identity.slug),
          listGroupMembers(identity.slug),
          listIdentityDescendants(identity.slug),
        ]);
  const inheritedChronicleTags =
    kind === "person"
      ? parentGroups.map((group) => group.slug)
      : descendants
          .filter((descendant) => descendant.metadata.kind === "person")
          .map((descendant) => descendant.slug);
  const posts = getTaggedPostsForTags([
    identity.slug,
    ...inheritedChronicleTags,
  ]);

  return (
    <DataPageShell width="wide">
      <SectionHeader
        eyebrow={`${context} ${noun}`}
        title={identity.displayName}
        description={`Shared identity #${identity.slug} in the ${context} context.`}
        actions={
          <Link href={directoryHref} className="btn">
            Back to {directoryLabel}
          </Link>
        }
      />
      <RelatedIdentities
        title={kind === "person" ? "Clans and squads" : "Member of"}
        identities={parentGroups}
        context={context}
      />
      {kind === "group" ? (
        <RelatedIdentities
          title="Members"
          identities={members}
          context={context}
        />
      ) : null}
      {parentGroups.length === 0 &&
      (kind === "person" || members.length === 0) ? (
        <Card as="section">
          <h2 className="!m-0 text-xl font-semibold">
            {kind === "person" ? "Clans and squads" : "Members"}
          </h2>
          <p className="!mb-0 mt-3 text-muted-foreground">
            No relationships are recorded yet.
          </p>
        </Card>
      ) : null}
      <SquadMemberPosts
        tag={identity.slug}
        posts={posts}
        includesAffiliatedClans={kind === "person" && parentGroups.length > 0}
        includesAffiliatedMembers={
          kind === "group" && inheritedChronicleTags.length > 0
        }
      />
    </DataPageShell>
  );
}
