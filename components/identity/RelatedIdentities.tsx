import TagLink from "@/components/tags/TagLink";

import { Card } from "@ui";
import type { Identity } from "@/lib/identity-server";
import type { IdentityContext } from "@/lib/identity";

export default function RelatedIdentities({
  title,
  identities,
}: {
  title: string;
  identities: Identity[];
  context: IdentityContext;
}) {
  if (identities.length === 0) return null;
  return (
    <Card as="section">
      <h2 className="!m-0 text-xl font-semibold">{title}</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {identities.map((identity) => {
          return (
            <li key={identity.id}>
              <TagLink tag={identity.slug} className="link-blue">
                {identity.displayName}
              </TagLink>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
