import { buildMetadata } from "@/lib/seo/builders";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import IdentityDirectoryPage from "@/components/identity/IdentityDirectoryPage";

export default function Page() {
  return (
    <IdentityDirectoryPage
      context="unclejimmy"
      directoryHref="/unclejimmy/fam"
      kind="person"
      title="Fam"
      description="People, stories and connections in the unclejimmy circle."
      emptyLabel="No Fam identities have been classified yet."
    />
  );
}

export const metadata = buildMetadata({
  title: "Fam | tullyelly",
  description: "People, stories and connections in the unclejimmy circle.",
  canonical: canonicalUrl("unclejimmy/fam"),
});
