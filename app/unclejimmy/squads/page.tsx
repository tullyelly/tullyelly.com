import { buildMetadata } from "@/lib/seo/builders";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import IdentityDirectoryPage from "@/components/identity/IdentityDirectoryPage";

export default function Page() {
  return (
    <IdentityDirectoryPage
      context="unclejimmy"
      directoryHref="/unclejimmy/squads"
      kind="group"
      title="Squads"
      description="Family groups, teams and the stories they share."
      emptyLabel="No Squads have been recorded yet."
    />
  );
}

export const metadata = buildMetadata({
  title: "Squads | tullyelly",
  description: "Groups, members and stories in the unclejimmy circle.",
  canonical: canonicalUrl("unclejimmy/squads"),
});
