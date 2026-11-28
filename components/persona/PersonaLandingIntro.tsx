import PageIntro from "@/components/layout/PageIntro";
import ArchiveReturnLink from "@/components/directory/ArchiveReturnLink";
import PersonaApplications from "./PersonaApplications";
import { getRootRequestData } from "@/lib/root-request-data";
import type { Persona } from "@/types/nav";

export default async function PersonaLandingIntro({
  persona,
  description,
}: {
  persona: Persona;
  description: string;
}) {
  const { menu } = await getRootRequestData();
  return (
    <div className="space-y-6">
      <ArchiveReturnLink />
      <PageIntro title={persona} description={description} />
      <PersonaApplications tree={menu.tree} persona={persona} />
    </div>
  );
}
