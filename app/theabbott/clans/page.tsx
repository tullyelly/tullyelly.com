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
