import TagLink from "@/components/tags/TagLink";

import DataPageShell from "@/components/layout/DataPageShell";
import SectionHeader from "@/components/layout/SectionHeader";
import { Card } from "@ui";
import { listIdentities } from "@/lib/identity-server";
import type { IdentityContext, IdentityKind } from "@/lib/identity";

export default async function IdentityDirectoryPage({
  context,
  kind,
  title,
  description,
  emptyLabel,
}: {
  context: IdentityContext;
  kind: IdentityKind;
  title: string;
  description: string;
  emptyLabel: string;
}) {
  const identities = await listIdentities({ context, kind });

  return (
    <DataPageShell width="wide">
      <SectionHeader
        eyebrow={context}
        title={title}
        description={description}
      />
      {identities.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {identities.map((identity) => {
            return (
              <li key={identity.id}>
                <Card as="article" className="h-full">
                  <h2 className="text-xl font-semibold">
                    <TagLink tag={identity.slug} className="link-blue">
                      {identity.displayName}
                    </TagLink>
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    #{identity.slug}
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        <Card as="p" className="text-muted-foreground">
          {emptyLabel}
        </Card>
      )}
    </DataPageShell>
  );
}
