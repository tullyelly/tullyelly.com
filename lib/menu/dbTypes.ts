import type { PersonaKey } from "@/lib/menu/personaKeys";

export type MenuNodeRow = {
  id: number;
  parent_id: number | null;
  persona: PersonaKey;
  kind: "persona" | "link";
  label: string;
  href: string | null;
  target: string | null;
  icon: string | null;
  order_index: number;
  feature_key: string | null;
  hidden: boolean;
  meta: Record<string, unknown> | null;
  published: boolean;
};
