"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "vaul";
import * as Lucide from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
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

type AnyLink = Extract<NavItem, { kind: "link" | "external" }>;

function isQuick(node: AnyLink): boolean {
  const anyNode = node as any;
  return !!anyNode?.meta?.quick;
}

function readDesc(node: AnyLink): string | undefined {
  const anyNode = node as any;
  return anyNode?.meta?.desc as string | undefined;
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

              <div className="space-y-4">
                <QuickLinks items={personas} />
                <Accordion type="single" collapsible className="w-full">
                  {personas.map((p) => (
                    <AccordionItem key={p.id} value={String(p.id)}>
                      <AccordionTrigger className="gap-2 py-3">
                        <Icon name={p.icon} className="size-4" />
                        <span className="capitalize">{p.label}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <PersonaSection persona={p} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

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

function QuickLinks({ items }: { items: PersonaItem[] }) {
  const links: AnyLink[] = [];
  for (const persona of items) {
    for (const child of persona.children ?? []) {
      if (
        (child.kind === "link" || child.kind === "external") &&
        isQuick(child as AnyLink)
      ) {
        links.push(child as AnyLink);
      }
    }
  }
  if (!links.length) return null;
  return (
    <div className="not-prose -mx-1 flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.id}
          href={link.href}
          prefetch
          className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm"
        >
          <Icon name={link.icon} className="size-4" />
          <span>{link.label}</span>
        </Link>
      ))}
    </div>
  );
}

function PersonaSection({ persona }: { persona: PersonaItem }) {
  const children = (persona.children ?? []).filter(
    (child): child is AnyLink =>
      child.kind === "link" || child.kind === "external",
  );
  if (!children.length) {
    return (
      <div className="py-2 text-sm text-muted-foreground">No links yet.</div>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-2">
      {children.map((child) => (
        <li key={child.id}>
          <Link
            href={child.href}
            prefetch
            className="block rounded-xl border p-3 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-center gap-2">
              <Icon name={child.icon} className="size-4" />
              <span className="font-medium">{child.label}</span>
            </div>
            {readDesc(child) ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {readDesc(child)}
              </p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
