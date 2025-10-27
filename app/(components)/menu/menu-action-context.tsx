"use client";

import * as React from "react";

export type PendingAction =
  | { type: "internal"; href: string }
  | { type: "external"; href: string; newTab?: boolean }
  | { type: "callback"; fn: () => void }
  | null;

type MenuActionContextValue = {
  pendingRef: React.MutableRefObject<PendingAction>;
};

const MenuActionContext = React.createContext<MenuActionContextValue | null>(
  null,
);

export function useMenuActionCtx(): MenuActionContextValue {
  const ctx = React.useContext(MenuActionContext);
  if (!ctx) {
    throw new Error(
      "MenuActionContext missing. Wrap components with <MenuActionProvider />.",
    );
  }
  return ctx;
}

export function MenuActionProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const pendingRef = React.useRef<PendingAction>(null);
  const value = React.useMemo(() => ({ pendingRef }), []);

  return (
    <MenuActionContext.Provider value={value}>
      {children}
    </MenuActionContext.Provider>
  );
}
