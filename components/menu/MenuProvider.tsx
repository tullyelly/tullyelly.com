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
  if (!ctx) {
    throw new Error("useMenuTree must be used within MenuProvider");
  }
  return ctx;
}
