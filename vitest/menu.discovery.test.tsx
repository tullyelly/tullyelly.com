import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { menuCoverageRows, publicDestinations } from "./fixtures/menu-coverage";
import { buildMenuPayload, buildPersonaChildren } from "@/lib/menu/buildMenu";
const state = vi.hoisted(() => ({
  rows: [] as unknown[],
  caps: new Set<string>(),
  push: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ sql: () => Promise.resolve(state.rows) }));
vi.mock("@/lib/authz/can", () => ({ can: () => false }));
vi.mock("@/app/_auth/session", () => ({
  getCapabilities: () =>
    Promise.resolve({
      all: state.caps,
      has: (key: string) => state.caps.has(key),
    }),
}));
vi.mock("@/lib/escape-hatches", () => ({
  isDbSkipEnabled: () => false,
  isMenuBypassEnabled: () => false,
  isTestMenuModeEnabled: () => false,
}));
vi.mock("@/lib/env", () => ({ isNextBuild: () => false }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("@/lib/blog", () => ({ getPublishedPosts: () => [] }));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/menu-test",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: state.push }),
}));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...props
  }: React.ComponentProps<"a">) => (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
      }}
    >
      {children}
    </a>
  ),
}));
import { getMenu } from "@/lib/menu/getMenu";
import { searchSite } from "@/lib/search/site-search";
import MobileDrawer from "@/components/nav/MobileDrawer";
import NavDesktop from "@/components/nav/NavDesktop";
import CommandMenu, { CommandMenuProvider } from "@/components/nav/CommandMenu";
import { NavControllerProvider } from "@/components/nav/NavController";

beforeEach(() => {
  state.rows = menuCoverageRows();
  state.caps = new Set();
  state.push.mockReset();
  window.localStorage.clear();
});
afterEach(cleanup);

describe("shared database menu discovery", () => {
  it("serializes explicit Admin requirements without losing attribution", async () => {
    expect(JSON.stringify((await getMenu()).tree)).not.toContain(
      "/mark2/admin",
    );
    state.caps = new Set(["admin.app.view", "admin.membership.manage"]);
    const tree = (await getMenu()).tree;
    const admin = tree
      .flatMap((item) => ("children" in item ? (item.children ?? []) : []))
      .find((item) => "href" in item && item.href === "/mark2/admin");
    expect(admin).toMatchObject({
      featureKey: "menu.mark2.admin",
      requires: ["admin.app.view", "admin.membership.manage"],
    });
  });
  it("site page search discovers every public destination through the actual loader", async () => {
    for (const href of publicDestinations)
      expect((await searchSite(href)).map((result) => result.href)).toContain(
        href,
      );
    expect(await searchSite("admin")).toEqual([]);
  });
  it("mobile exposes tags without searching, one Shaolin landing and unique IDs; clicking closes", async () => {
    const rows = menuCoverageRows();
    const menu = await buildMenuPayload(rows, "shaolin", () => false);
    const childrenMap = await buildPersonaChildren(rows, () => false);
    const close = vi.fn();
    render(
      <NavControllerProvider>
        <MobileDrawer
          open
          onOpenChange={close}
          menu={menu}
          childrenMap={childrenMap}
        />
      </NavControllerProvider>,
    );
    expect(screen.getAllByRole("button", { name: "shaolin" })).toHaveLength(2); // quick landing plus accordion, distinct controls
    fireEvent.click(
      screen.getByRole("button", { name: "shaolin", expanded: false }),
    );
    expect(screen.queryByRole("button", { name: "chronicles" })).toBeNull();
    expect(screen.getAllByRole("link", { name: "Home" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Search" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Sign in" })).toHaveLength(1);
    const tags = screen.getByRole("button", { name: "Chronicle tags" });
    expect(tags).toBeVisible();
    const ids = Array.from(document.querySelectorAll("[id]")).map(
      (el) => el.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
    fireEvent.click(tags);
    expect(state.push).toHaveBeenCalledWith("/shaolin/tags");
    await waitFor(() => expect(close).toHaveBeenCalledWith(false));
  });
  it.each(["cardattack", "unclejimmy"] as const)(
    "mobile reaches the last %s link and Escape collapses",
    async (persona) => {
      const menu = await buildMenuPayload(
        menuCoverageRows(),
        persona,
        () => false,
      );
      const childrenMap = await buildPersonaChildren(
        menuCoverageRows(),
        () => false,
      );
      render(
        <NavControllerProvider>
          <MobileDrawer
            open
            onOpenChange={vi.fn()}
            menu={menu}
            childrenMap={childrenMap}
          />
        </NavControllerProvider>,
      );
      const toggle = screen.getByRole("button", {
        name: persona,
        expanded: false,
      });
      toggle.focus();
      fireEvent.click(toggle);
      const panel = document.getElementById(
        toggle.getAttribute("aria-controls")!,
      )!;
      const last = childrenMap[persona].at(-1)!;
      fireEvent.click(
        Array.from(panel.querySelectorAll("button")).find((el) =>
          el.textContent?.includes(last.label),
        )!,
      );
      expect(state.push).toHaveBeenCalledWith(last.href);
      fireEvent.keyDown(toggle, { key: "Escape" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(toggle).toHaveFocus();
    },
  );
  it("desktop exposes the final links in both longer sections", async () => {
    const menu = await buildMenuPayload(
      menuCoverageRows(),
      "shaolin",
      () => false,
    );
    const childrenMap = await buildPersonaChildren(
      menuCoverageRows(),
      () => false,
    );
    render(
      <CommandMenuProvider items={(await getMenu()).tree}>
        <NavControllerProvider>
          <NavDesktop menu={menu} childrenMap={childrenMap} />
        </NavControllerProvider>
      </CommandMenuProvider>,
    );
    fireEvent.click(screen.getByTestId("nav-desktop-menu"));
    for (const persona of ["cardattack", "unclejimmy"] as const)
      expect(
        document.querySelector(
          `a[href="${childrenMap[persona].at(-1)!.href}"]`,
        ),
      ).toBeVisible();
  });
  it("command searches discover all new public destinations", async () => {
    const { tree } = await getMenu();
    render(
      <CommandMenuProvider items={tree}>
        <CommandMenu />
      </CommandMenuProvider>,
    );
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const input = await screen.findByPlaceholderText(/find a page/i);
    for (const query of [
      "Chronicle tags",
      "Local Card Shops",
      "USPS",
      "Volleyball Tournaments",
      "Bricks",
      "Call A Save Point",
      "Golden Age",
      "Table Schema",
      "Traffic statistics",
      "Flowers",
      "Releases",
    ]) {
      fireEvent.change(input, { target: { value: query } });
      await waitFor(() =>
        expect(
          screen
            .getAllByRole("option")
            .some((option) =>
              option.textContent?.toLowerCase().includes(query.toLowerCase()),
            ),
        ).toBe(true),
      );
    }
    for (const href of publicDestinations.filter((href) =>
      href.endsWith("/releases"),
    )) {
      await waitFor(() =>
        expect(
          screen
            .getAllByRole("option")
            .some((option) =>
              option.getAttribute("data-value")?.includes(href),
            ),
        ).toBe(true),
      );
    }
    expect(
      document.querySelector('[data-testid="menu-item-menu.mark2.admin"]'),
    ).toBeNull();
  });
});
