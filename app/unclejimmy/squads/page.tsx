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
