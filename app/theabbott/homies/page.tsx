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
