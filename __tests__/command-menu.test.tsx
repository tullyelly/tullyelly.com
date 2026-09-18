import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CommandMenu, {
  CommandMenuProvider,
  useCommandMenu,
} from "@/components/nav/CommandMenu";
import type { NavItem } from "@/types/nav";
import { RECENT_STORAGE_KEY } from "@/lib/menu.recents";

const mockRouterPush = jest.fn();
const mockUseRouter = jest.fn(() => ({ push: mockRouterPush }));

jest.mock("next/navigation", () => ({
  usePathname: () => "/current",
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
    window.localStorage.clear();
    mockUseRouter.mockClear();
    mockRouterPush.mockReset();
  });

  it("renders featured, recent, and persona sections", async () => {
    window.localStorage.setItem(
      RECENT_STORAGE_KEY,
      JSON.stringify(["/recent"]),
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

    const recentHeadings = await screen.findAllByText("Recent");
    expect(
      recentHeadings.some((node) => node.hasAttribute("cmdk-group-heading")),
    ).toBe(true);

    const personaHeadings = await screen.findAllByText("Mark II");
    expect(
      personaHeadings.some((node) => node.hasAttribute("cmdk-group-heading")),
    ).toBe(true);
    expect(screen.queryByText("Hidden")).toBeNull();
  });

  it("keeps navigation filtering and offers an encoded full-site search", async () => {
    render(
      <CommandMenuProvider items={items}>
        <OpenMenuOnMount />
        <CommandMenu />
      </CommandMenuProvider>,
    );

    const input = await screen.findByPlaceholderText("Type a page or feature…");
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
});
