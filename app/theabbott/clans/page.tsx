import { buildMetadata } from "@/lib/seo/builders";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import IdentityDirectoryPage from "@/components/identity/IdentityDirectoryPage";

export default function Page() {
  return (
    <IdentityDirectoryPage
      context="theabbott"
      directoryHref="/theabbott/clans"
      kind="group"
      title="Clans"
      description="Bands, groups and collectives; explore their members and music."
      emptyLabel="No theabbott Clans have been recorded yet."
    />
  );
}

export const metadata = buildMetadata({
  title: "Clans | tullyelly",
  description: "Music groups, members and their stories.",
  canonical: canonicalUrl("theabbott/clans"),
});
