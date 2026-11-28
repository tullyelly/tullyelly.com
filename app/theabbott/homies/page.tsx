import { buildMetadata } from "@/lib/seo/builders";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import IdentityDirectoryPage from "@/components/identity/IdentityDirectoryPage";

export default function Page() {
  return (
    <IdentityDirectoryPage
      context="theabbott"
      directoryHref="/theabbott/homies"
      kind="person"
      title="Homies"
      description="Individual artists, their music and their stories."
      emptyLabel="No theabbott Homies have been recorded yet."
    />
  );
}

export const metadata = buildMetadata({
  title: "Homies | tullyelly",
  description: "Individual artists, their music and their stories.",
  canonical: canonicalUrl("theabbott/homies"),
});
