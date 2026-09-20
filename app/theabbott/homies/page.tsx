import IdentityDirectoryPage from "@/components/identity/IdentityDirectoryPage";

export default function Page() {
  return (
    <IdentityDirectoryPage
      context="theabbott"
      kind="person"
      title="Homies"
      description="Individual artists represented by shared site identities."
      emptyLabel="No theabbott Homies have been classified yet."
    />
  );
}
