"use client";

import * as React from "react";
import type { Persona } from "@/types/nav";

export type PersonaSummary = {
  id: string;
  persona: Persona;
  label: string;
  icon?: string;
} | null;

export type AppShellContextValue = {
  mobileNavOpen: boolean;
  setMobileNavOpen(next: boolean): void;
  openMobileNav(options?: { personaId?: string | null }): void;
  mobileNavPersonaId: string | null;
  setMobileNavPersonaId(id: string | null): void;
  currentPersona: PersonaSummary;
  siteTitle: string;
};

const AppShellContext = React.createContext<AppShellContextValue | null>(null);

export function AppShellProvider({
  value,
  children,
}: {
  value: AppShellContextValue;
  children: React.ReactNode;
}) {
  return (
    <AppShellContext.Provider value={value}>
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell(): AppShellContextValue {
  const context = React.useContext(AppShellContext);
  if (!context) {
    throw new Error("useAppShell must be used within an AppShellProvider");
  }
  return context;
}

export function useOptionalAppShell(): AppShellContextValue | null {
  return React.useContext(AppShellContext);
}
