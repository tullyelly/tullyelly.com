"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useNavController } from "@/components/nav/NavController";

export function useNavResetOnRouteChange(): void {
  const pathname = usePathname();
  const { closeAll } = useNavController();

  React.useEffect(() => {
    closeAll();
    if (typeof document !== "undefined") {
      const active = document.activeElement as HTMLElement | null;
      if (active && typeof active.blur === "function") {
        active.blur();
      }
    }
  }, [pathname, closeAll]);
}
