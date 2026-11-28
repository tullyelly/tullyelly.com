import PageIntro from "@/components/layout/PageIntro";
import IdentityDirectoryClient from "./IdentityDirectoryClient";
import { getTagAliasSnapshot } from "@/lib/tag-aliases-server";
import { equivalentTagSlugs } from "@/lib/tag-aliases";

import DataPageShell from "@/components/layout/DataPageShell";
import { listIdentities } from "@/lib/identity-server";
import type { IdentityContext, IdentityKind } from "@/lib/identity";

export default async function IdentityDirectoryPage({
  context,
  directoryHref,
  kind,
  title,
  description,
  emptyLabel,
}: {
  context: IdentityContext;
  directoryHref: string;
  kind: IdentityKind;
  title: string;
  description: string;
  emptyLabel: string;
}) {
  const identities = await listIdentities({ context, kind });

  const aliases = await getTagAliasSnapshot();
  return (
    <DataPageShell>
      <PageIntro title={title} eyebrow={context} description={description} />
      <IdentityDirectoryClient
        directoryHref={directoryHref}
        title={title}
        emptyLabel={emptyLabel}
        identities={identities.map((identity) => ({
          id: identity.id,
          slug: identity.slug,
          displayName: identity.displayName,
          aliases: equivalentTagSlugs(identity.slug, aliases),
        }))}
      />
    </DataPageShell>
  );
}
