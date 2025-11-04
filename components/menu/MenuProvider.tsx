"use client";

import { createContext, useContext } from "react";
import type { MenuNode } from "@/lib/menu/tree";

const MenuCtx = createContext<MenuNode[] | null>(null);

type MenuProviderProps = {
  value: MenuNode[];
  children: React.ReactNode;
};

export function MenuProvider({ value, children }: MenuProviderProps) {
  return <MenuCtx.Provider value={value}>{children}</MenuCtx.Provider>;
}

export function useMenuTree(): MenuNode[] {
  const ctx = useContext(MenuCtx);
  if (ctx) return ctx;
  // NEXT_PUBLIC_E2E=true means tests are running against a built bundle without the provider.
  // Return an inert tree so SSR/E2E environments do not crash.
  if (process.env.NEXT_PUBLIC_E2E === "true") {
    return [];
  }
  throw new Error("useMenuTree must be used within MenuProvider");
}
