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
