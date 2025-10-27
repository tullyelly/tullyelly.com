import { notFound } from "next/navigation";
import MenuTestbed from "./MenuTestbed";
import { TEST_MENU_ITEMS } from "@/lib/menu.test-data";
import type { PersonaItem } from "@/types/nav";

export const dynamic = "force-dynamic";

export default function MenuTestPage() {
  if (process.env.E2E_MODE !== "1") {
    notFound();
  }

  const persona = TEST_MENU_ITEMS.find(
    (item): item is PersonaItem =>
      item.kind === "persona" && item.persona === "mark2",
  );

  if (!persona) {
    throw new Error("Missing mark2 persona for menu test page");
  }

  return (
    <div className="bg-transparent">
      <MenuTestbed persona={persona} />
    </div>
  );
}
