import ContextDirectoryReturn from "@/components/directory/ContextDirectoryReturn";
import type { ReactNode } from "react";
import CollectionRelationships from "@/components/identity/CollectionRelationships";
import DirectoryReturnLink from "@/components/directory/DirectoryReturnLink";
import PageIntro from "@/components/layout/PageIntro";
import {
  safeDirectoryReturn,
  withDirectoryReturn,
} from "@/lib/directory-state";
import { normalizeTagSlug } from "@/lib/tags";
import { notFound, redirect } from "next/navigation";

import DataPageShell from "@/components/layout/DataPageShell";
import RelatedIdentities from "@/components/identity/RelatedIdentities";
import SquadMemberPosts from "@/components/unclejimmy/SquadMemberPosts";
import { Card } from "@ui";
import { getIdentityTaggedPosts } from "@/lib/identity-chronicles";
import type { IdentityContext, IdentityKind } from "@/lib/identity";
import {
  getIdentityBySlug,
  getIdentityHref,
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
  returnTo,
  music,
}: {
  slug: string;
  context: IdentityContext;
  kind: IdentityKind;
  noun: string;
  directoryHref: string;
  directoryLabel: string;
  returnTo?: string;
  music?: ReactNode;
}) {
  const identity = await getIdentityBySlug(slug);
  if (!identity || identity.metadata.kind !== kind) notFound();
  if (identity.slug !== normalizeTagSlug(slug)) {
    const role = identity.metadata.contexts[context]?.role;
    const href = getIdentityHref(identity, context);
    if (
      !href ||
      (kind === "person" &&
        role !== (context === "unclejimmy" ? "fam" : "homie"))
    )
      notFound();
    redirect(
      returnTo
        ? withDirectoryReturn(
            href,
            safeDirectoryReturn(
              returnTo,
              context === "theabbott" &&
                returnTo.split("?")[0] === "/theabbott/crates"
                ? "/theabbott/crates"
                : directoryHref,
            ),
          )
        : href,
    );
  }
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
  const posts = await getIdentityTaggedPosts([
    identity.slug,
    ...inheritedChronicleTags,
  ]);

  return (
    <DataPageShell width="wide">
      <PageIntro
        eyebrow={`${context} ${noun}`}
        title={identity.displayName}
        description={
          context === "theabbott"
            ? "Music, memberships and the stories connected to this artist."
            : kind === "person"
              ? "Stories, groups and the collections connected to this person."
              : "Members, shared stories and the collections connected to this group."
        }
        actions={
          <div className="flex flex-wrap gap-3">
            <DirectoryReturnLink directory={directoryHref} className="btn">
              Back to {directoryLabel}
            </DirectoryReturnLink>
            {context === "theabbott" ? (
              <ContextDirectoryReturn
                directory="/theabbott/crates"
                label="Back to Crates"
              />
            ) : null}
          </div>
        }
      />
      <nav aria-label="On this page" className="flex flex-wrap gap-3">
        <a className="link-blue" href="#identity-memberships">
          Memberships
        </a>
        <a className="link-blue" href="#identity-collections">
          {context === "theabbott" ? "Music" : "Collections"}
        </a>
        <a className="link-blue" href="#identity-chronicles">
          Chronicles
        </a>
      </nav>
      <div id="identity-memberships" className="scroll-mt-24 space-y-4">
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
      </div>
      <div id="identity-collections" className="scroll-mt-24">
        {context === "theabbott" ? (
          music
        ) : (
          <CollectionRelationships
            slug={identity.slug}
            displayName={identity.displayName}
            mode={
              context === "unclejimmy" && kind === "person"
                ? "person"
                : "subject"
            }
          />
        )}
      </div>
      <div id="identity-chronicles" className="scroll-mt-24">
        <SquadMemberPosts
          tag={identity.slug}
          posts={posts}
          includesAffiliatedClans={kind === "person" && parentGroups.length > 0}
          includesAffiliatedMembers={
            kind === "group" && inheritedChronicleTags.length > 0
          }
        />
      </div>
    </DataPageShell>
  );
}
