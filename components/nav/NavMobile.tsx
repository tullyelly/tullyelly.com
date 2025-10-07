"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Drawer } from "vaul";
import * as Lucide from "lucide-react";
import { useCommandMenu } from "@/components/nav/CommandMenu";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { NavItem, PersonaItem } from "@/types/nav";
import { analytics } from "@/lib/analytics";
import { TEST_MENU_ITEMS } from "@/lib/menu.test-data";

const TEST_MODE =
  process.env.NEXT_PUBLIC_TEST_MODE === "1" || process.env.TEST_MODE === "1";

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
  const search = useSearchParams();
  const searchKey = search?.toString();
  const personas = React.useMemo(() => {
    const provided = (items ?? []).filter(isPersona);
    if (provided.length) return provided;
    if (TEST_MODE) {
      return TEST_MENU_ITEMS.filter(isPersona);
    }
    return provided;
  }, [items]);

  const { setOpen: setCommandMenuOpen } = useCommandMenu();
  const openCommandMenu = React.useCallback(
    () => setCommandMenuOpen(true),
    [setCommandMenuOpen],
  );

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const closeNow = React.useCallback(() => setOpen(false), []);
  const prevOpenRef = React.useRef(open);
  React.useEffect(() => {
    if (open) {
      triggerRef.current?.blur();
    }
  }, [open]);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname, searchKey]);

  React.useEffect(() => {
    if (open && !prevOpenRef.current) {
      analytics.track("menu.mobile.open", { state: "open" });
    } else if (!open && prevOpenRef.current) {
      analytics.track("menu.mobile.open", { state: "closed" });
    }
    prevOpenRef.current = open;
  }, [open]);

  const handleLinkSelect = React.useCallback(
    (persona: PersonaItem, link: AnyLink) => {
      analytics.track("menu.mobile.click", {
        path: link.href,
        featureKey: link.featureKey ?? null,
        persona: persona.persona,
      });
      closeNow();
    },
    [closeNow],
  );

  const handleAccordionChange = React.useCallback(
    (value: string | undefined) => {
      if (!value) {
        analytics.track("menu.mobile.open", { state: "accordion-closed" });
        return;
      }

      const persona = personas.find((item) => String(item.id) === value);
      analytics.track("menu.mobile.open", {
        state: "accordion-open",
        persona: persona?.persona ?? null,
      });
    },
    [personas],
  );

  if (!personas.length) return null;

  return (
    <div
      data-testid="nav-mobile"
      data-state={open ? "open" : "closed"}
      className="border-b bg-transparent text-white md:hidden"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        <button
          ref={triggerRef}
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-blue/10 px-3 py-2 text-sm text-white hover:bg-white/10"
        >
          <Lucide.Menu className="size-4" />
          Menu
        </button>
        <button
          type="button"
          aria-label="Open command menu"
          onClick={openCommandMenu}
          className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
        >
          <Lucide.Command className="size-4" aria-hidden="true" />
          <span className="text-sm">Search</span>
        </button>
      </div>

      <Drawer.Root
        data-state={open ? "open" : "closed"}
        open={open}
        onOpenChange={setOpen}
        shouldScaleBackground={false}
        closeThreshold={0.25}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Drawer.Content
            data-vaul-lock="body"
            data-testid="nav-mobile-drawer"
            data-state={open ? "open" : "closed"}
            className="fixed inset-x-0 bottom-0 z-[90] rounded-t-2xl bg-background shadow-xl"
            aria-label="Site navigation"
          >
            <Drawer.Title>
              <VisuallyHidden>Site navigation menu</VisuallyHidden>
            </Drawer.Title>
            <Drawer.Description>
              <VisuallyHidden>Select a destination below.</VisuallyHidden>
            </Drawer.Description>

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

              <div className="mt-4 space-y-4">
                <QuickLinks items={personas} onSelect={handleLinkSelect} />
                <Accordion
                  type="single"
                  collapsible
                  className="w-full"
                  onValueChange={handleAccordionChange}
                >
                  {personas.map((p) => (
                    <AccordionItem key={p.id} value={String(p.id)}>
                      <AccordionTrigger
                        className="gap-2 py-3"
                        data-testid={`mobile-accordion-${p.id}`}
                      >
                        <Icon name={p.icon} className="size-4" />
                        <span>{p.label}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <PersonaSection
                          persona={p}
                          onSelect={handleLinkSelect}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="mt-4 text-[11px] text-muted-foreground">
                Tip: swipe down or press Esc to close
              </div>
            </div>
            <div
              className="mt-4 flex justify-center pb-2"
              id="drawer-bottom-esc"
            >
              <Drawer.Close asChild>
                <button
                  type="button"
                  className="rounded-full border px-4 py-2 text-sm hover:bg-accent"
                >
                  Close
                </button>
              </Drawer.Close>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

function QuickLinks({
  items,
  onSelect,
}: {
  items: PersonaItem[];
  onSelect: (persona: PersonaItem, link: AnyLink) => void;
}) {
  const entries: Array<{ persona: PersonaItem; link: AnyLink }> = [];
  for (const persona of items) {
    for (const child of persona.children ?? []) {
      if (
        (child.kind === "link" || child.kind === "external") &&
        isQuick(child as AnyLink)
      ) {
        entries.push({ persona, link: child as AnyLink });
      }
    }
  }
  if (!entries.length) return null;
  return (
    <div className="not-prose -mx-1 flex flex-wrap gap-2">
      {entries.map(({ persona, link }) => (
        <Link
          key={link.id}
          href={link.href}
          prefetch
          className="inline-flex items-center gap-2 rounded-full border border-border/50 px-3 py-1 text-sm hover:shadow-sm focus-visible:ring-2 focus-visible-ring"
          data-mobile-link={link.id}
          data-testid={
            link.featureKey
              ? `menu-item-${link.featureKey}`
              : `menu-item-${link.id}`
          }
          onClick={() => onSelect(persona, link)}
        >
          <Icon name={link.icon} className="size-4" />
          <span>{link.label}</span>
        </Link>
      ))}
    </div>
  );
}

function PersonaSection({
  persona,
  onSelect,
}: {
  persona: PersonaItem;
  onSelect: (persona: PersonaItem, link: AnyLink) => void;
}) {
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
            className="block rounded-xl border p-3 hover:shadow-sm focus-visible:ring-2 focus-visible-ring"
            data-mobile-link={child.id}
            data-testid={
              child.featureKey
                ? `menu-item-${child.featureKey}`
                : `menu-item-${child.id}`
            }
            onClick={() => onSelect(persona, child)}
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
