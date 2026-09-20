import IdentityDirectoryPage from "@/components/identity/IdentityDirectoryPage";

export default function Page() {
  return (
    <IdentityDirectoryPage
      context="unclejimmy"
      kind="person"
      title="Fam"
      description="People in the unclejimmy circle, backed by shared identities."
      emptyLabel="No Fam identities have been classified yet."
    />
  );
}
