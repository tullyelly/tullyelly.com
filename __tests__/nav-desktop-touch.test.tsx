import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NavDesktop from "@/components/nav/NavDesktop";
import { NavControllerProvider } from "@/components/nav/NavController";
import CommandMenu, { CommandMenuProvider } from "@/components/nav/CommandMenu";
import type { MenuPayload, PersonaChildren } from "@/lib/menu/types";

jest.mock("next/navigation", () => ({
  usePathname: () => "/shaolin/aau-nationals",
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: () => ({ data: null, status: "unauthenticated" }),
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

const menu: MenuPayload = {
  persona: "shaolin",
  sections: [
    {
      id: "personas",
      title: "By alter ego",
      items: [
        {
          id: "p-tullyelly",
          label: "tullyelly",
          href: "/tullyelly",
          iconKey: "Code2",
        },
      ],
    },
  ],
};

const childrenMap: PersonaChildren = {
  shaolin: [],
  mark2: [],
  tullyelly: [
    {
      id: "overview",
      label: "forge",
      href: "/tullyelly",
      feature: "menu.tullyelly.overview",
    },
    {
      id: "ruins",
      label: "ruins",
      href: "/tullyelly/ruins",
      feature: "menu.tullyelly.docs",
    },
  ],
  unclejimmy: [],
  cardattack: [],
  theabbott: [],
};

function renderDesktopNav() {
  render(
    <CommandMenuProvider items={[]}>
      <NavControllerProvider>
        <NavDesktop menu={menu} childrenMap={childrenMap} />
        <CommandMenu />
      </NavControllerProvider>
    </CommandMenuProvider>,
  );
}

describe("NavDesktop", () => {
  it("shows a global search trigger that opens the command menu", async () => {
    renderDesktopNav();

    const trigger = screen.getByRole("button", {
      name: "Search tullyelly",
    });
    expect(screen.getByTestId("nav-desktop")).toHaveClass("lg:block");
    fireEvent.click(trigger);

    expect(
      await screen.findByPlaceholderText("Find a page or search tullyelly…"),
    ).toBeVisible();
  });

  it("opens all persona destinations from one desktop menu", () => {
    renderDesktopNav();

    const trigger = screen.getByRole("button", { name: "Menu" });
    fireEvent.click(trigger);

    expect(screen.getByTestId("nav-desktop-panel")).toBeInTheDocument();
    expect(screen.queryByText("Explore tullyelly")).toBeNull();
    expect(screen.getByRole("link", { name: "ruins" })).toBeInTheDocument();
  });

  it("returns focus to the menu trigger when Escape closes the panel", async () => {
    renderDesktopNav();

    const trigger = screen.getByRole("button", { name: "Menu" });
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByTestId("nav-desktop-panel"), {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
    });

    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
