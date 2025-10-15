"use client";

import * as React from "react";

type BreadcrumbSlotContextValue = {
  override: React.ReactNode | null;
  setOverride: (node: React.ReactNode | null) => void;
};

const BreadcrumbSlotContext =
  React.createContext<BreadcrumbSlotContextValue | null>(null);

export function BreadcrumbSlotProvider({
  value,
  children,
}: {
  value: BreadcrumbSlotContextValue;
  children: React.ReactNode;
}) {
  return (
    <BreadcrumbSlotContext.Provider value={value}>
      {children}
    </BreadcrumbSlotContext.Provider>
  );
}

export function useBreadcrumbSlotController(): BreadcrumbSlotContextValue | null {
  return React.useContext(BreadcrumbSlotContext);
}
