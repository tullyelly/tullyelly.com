import IdentityDirectoryPage from "@/components/identity/IdentityDirectoryPage";

export default function Page() {
  return (
    <IdentityDirectoryPage
      context="unclejimmy"
      kind="group"
      title="Squads"
      description="Groups and teams in the unclejimmy context."
      emptyLabel="No Squads have been classified yet."
    />
  );
}
