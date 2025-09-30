"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "vaul";
import * as Lucide from "lucide-react";
import type { NavItem, PersonaItem } from "@/types/nav";

type Props = {
  items?: NavItem[]; // personas-first tree from server
};

function isPersona(x: NavItem): x is PersonaItem {
  return x.kind === "persona";
}

function Icon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const maybeIcon = Lucide[name as keyof typeof Lucide];
  if (typeof maybeIcon !== "function") return null;
  const IconComponent = maybeIcon as React.ComponentType<{
    className?: string;
  }>;
  return <IconComponent className={className} aria-hidden="true" />;
}

export default function NavMobile({ items }: Props) {
  const pathname = usePathname();
  const personas = (items ?? []).filter(isPersona);

  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!personas.length) return null;

  return (
    <div className="border-b md:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm"
        >
          <Lucide.Menu className="size-4" />
          Menu
        </button>
        <div />
      </div>

      <Drawer.Root
        open={open}
        onOpenChange={setOpen}
        shouldScaleBackground={false}
        closeThreshold={0.25}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Drawer.Content
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-background shadow-xl"
            aria-label="Site navigation"
          >
            <div className="mx-auto max-w-7xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lucide.Compass className="size-5" />
                  <span className="font-medium">Navigate</span>
                </div>
                <Drawer.Close asChild>
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="rounded-md p-2 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Lucide.X className="size-5" />
                  </button>
                </Drawer.Close>
              </div>

              <div id="drawer-content" />

              <div className="mt-4 text-[11px] text-muted-foreground">
                Tip: swipe down or press Esc to close
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
