import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CommandMenu, {
  CommandMenuProvider,
  useCommandMenu,
} from "@/components/nav/CommandMenu";
import type { NavItem } from "@/types/nav";
import { RECENT_STORAGE_KEY } from "@/lib/menu.recents";

let mockPathname = "/current";

const mockRouterPush = jest.fn();
const mockUseRouter = jest.fn(() => ({ push: mockRouterPush }));

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => mockUseRouter(),
}));

beforeAll(() => {
  if (typeof window.ResizeObserver === "undefined") {
    class StubResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.ResizeObserver = StubResizeObserver;
  }

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

function OpenMenuOnMount() {
  const { setOpen } = useCommandMenu();
  React.useEffect(() => {
    setOpen(true);
  }, [setOpen]);
  return null;
}

function OpenMenuButton() {
  const { setOpen } = useCommandMenu();
  return <button onClick={() => setOpen(true)}>Open search</button>;
}

const items: NavItem[] = [
  {
    id: "persona.mark2",
    kind: "persona",
    persona: "mark2",
    label: "Mark II",
    icon: "Sparkle",
    children: [
      {
        id: "featured.link",
        kind: "link",
        label: "Spotlight",
        href: "/spotlight",
        badge: { text: "Featured", type: "featured" },
      },
      {
        id: "recent.link",
        kind: "link",
        label: "Recent",
        href: "/recent",
      },
      {
        id: "hidden.link",
        kind: "link",
        label: "Hidden",
        href: "/hidden",
        hidden: true,
      },
    ],
  },
];

describe("CommandMenu", () => {
  beforeEach(() => {
    mockPathname = "/current";
    window.localStorage.clear();
    mockUseRouter.mockClear();
    mockRouterPush.mockReset();
  });

  it("shows concise discovery sections before switching to filtered personas", async () => {
    window.localStorage.setItem(
      RECENT_STORAGE_KEY,
      JSON.stringify([{ href: "/recent", title: "Recent" }]),
    );

    render(
      <CommandMenuProvider items={items}>
        <OpenMenuOnMount />
        <CommandMenu />
      </CommandMenuProvider>,
    );

    const featuredHeadings = await screen.findAllByText("Featured");
    expect(
      featuredHeadings.some((node) => node.hasAttribute("cmdk-group-heading")),
    ).toBe(true);

    const recentHeadings = await screen.findAllByText("Recently Viewed");
    expect(
      recentHeadings.some((node) => node.hasAttribute("cmdk-group-heading")),
    ).toBe(true);

    expect(
      Array.from(document.querySelectorAll("[cmdk-group-heading]")).some(
        (node) => node.textContent === "Mark II",
      ),
    ).toBe(false);

    fireEvent.change(
      screen.getByPlaceholderText("Find a page or search tullyelly…"),
      { target: { value: "Recent" } },
    );

    const personaHeadings = await screen.findAllByText("Mark II");
    expect(
      personaHeadings.some((node) => node.hasAttribute("cmdk-group-heading")),
    ).toBe(true);
    expect(screen.queryByText("Hidden")).toBeNull();
  });

  it("renders and navigates to a recently viewed item outside the menu", async () => {
    window.localStorage.setItem(
      RECENT_STORAGE_KEY,
      JSON.stringify([
        {
          href: "/shaolin/a-deep-cut",
          title: "A Deep Cut",
          category: "Chronicle",
        },
      ]),
    );

    render(
      <CommandMenuProvider items={items}>
        <OpenMenuOnMount />
        <CommandMenu />
      </CommandMenuProvider>,
    );

    expect(await screen.findByText("Recently Viewed")).toBeInTheDocument();
    const recent = await screen.findByText("A Deep Cut");
    fireEvent.click(recent);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/shaolin/a-deep-cut");
    });
  });

  it("keeps navigation filtering and offers an encoded full-site search", async () => {
    render(
      <CommandMenuProvider items={items}>
        <OpenMenuOnMount />
        <CommandMenu />
      </CommandMenuProvider>,
    );

    const input = await screen.findByPlaceholderText(
      "Find a page or search tullyelly…",
    );
    fireEvent.change(input, { target: { value: "Recent cards" } });

    expect(screen.queryByText("Spotlight")).toBeNull();
    const action = await screen.findByText(
      'Search all tullyelly for "Recent cards"',
    );
    fireEvent.click(action);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/search?q=Recent%20cards");
    });
  });

  it("restores focus to its trigger when Escape closes the menu", async () => {
    render(
      <CommandMenuProvider items={items}>
        <OpenMenuButton />
        <CommandMenu />
      </CommandMenuProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Open search" });
    trigger.focus();
    fireEvent.click(trigger);

    const input = await screen.findByPlaceholderText(
      "Find a page or search tullyelly…",
    );
    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => expect(trigger).toHaveFocus());
  });
  it("leaves an initially closed dialog unmounted without taking focus", async () => {
    render(
      <CommandMenuProvider items={items}>
        <OpenMenuButton />
        <CommandMenu />
      </CommandMenuProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Open search" });
    trigger.focus();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole("dialog", { hidden: true })).toBeNull();
    expect(screen.queryByTestId("cmdk")).toBeNull();
  });

  it.each(["Escape", "shortcut", "selection", "outside", "route"])(
    "unmounts and restores focus after %s closes the dialog",
    async (reason) => {
      const view = () => (
        <CommandMenuProvider items={items}>
          <OpenMenuButton />
          <CommandMenu />
          <main>Destination</main>
        </CommandMenuProvider>
      );
      const { rerender } = render(view());
      const trigger = screen.getByRole("button", { name: "Open search" });
      trigger.focus();
      fireEvent.keyDown(trigger, { key: "k", ctrlKey: true });
      const input = await screen.findByPlaceholderText(
        "Find a page or search tullyelly…",
      );
      await waitFor(() => expect(input).toHaveFocus());
      expect(screen.getByRole("dialog")).not.toHaveAttribute(
        "aria-modal",
        "true",
      );
      if (reason === "Escape") fireEvent.keyDown(input, { key: "Escape" });
      if (reason === "shortcut")
        fireEvent.keyDown(input, { key: "k", ctrlKey: true });
      if (reason === "selection")
        fireEvent.click(screen.getByText("Spotlight"));
      if (reason === "outside") fireEvent.pointerDown(document.body);
      if (reason === "route") {
        mockPathname = "/destination";
        rerender(view());
      }
      await waitFor(() => expect(screen.queryByTestId("cmdk")).toBeNull());
      await waitFor(() => expect(trigger).toHaveFocus());
    },
  );

  it("returns focus to main when a route removes the original trigger", async () => {
    const view = (showTrigger: boolean) => (
      <CommandMenuProvider items={items}>
        {showTrigger && <OpenMenuButton />}
        <CommandMenu />
        <main>Destination</main>
      </CommandMenuProvider>
    );
    const { rerender } = render(view(true));
    const trigger = screen.getByRole("button", { name: "Open search" });
    trigger.focus();
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus());
    mockPathname = "/destination";
    rerender(view(false));
    await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());
    expect(screen.queryByTestId("cmdk")).toBeNull();
  });

  it("keeps focus on an outside control that dismisses the non-modal dialog", async () => {
    render(
      <CommandMenuProvider items={items}>
        <OpenMenuButton />
        <button>Outside action</button>
        <CommandMenu />
      </CommandMenuProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Open search" });
    trigger.focus();
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus());
    const outside = screen.getByRole("button", { name: "Outside action" });
    fireEvent.pointerDown(outside);
    outside.focus();
    await waitFor(() => expect(screen.queryByTestId("cmdk")).toBeNull());
    await waitFor(() => expect(outside).toHaveFocus());
  });
});
