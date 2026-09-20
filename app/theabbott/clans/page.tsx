import IdentityDirectoryPage from "@/components/identity/IdentityDirectoryPage";

export default function Page() {
  return (
    <IdentityDirectoryPage
      context="theabbott"
      kind="group"
      title="Clans"
      description="Bands, groups, and collectives represented by shared site identities."
      emptyLabel="No theabbott Clans have been classified yet."
    />
  );
}
