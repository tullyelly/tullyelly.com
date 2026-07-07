import { fireEvent, render, screen } from "@testing-library/react";
import NavDesktop from "@/components/nav/NavDesktop";
import { NavControllerProvider } from "@/components/nav/NavController";
import type { MenuPayload, PersonaChildren } from "@/lib/menu/types";

jest.mock("next/navigation", () => ({
  usePathname: () => "/shaolin/aau-nationals",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: () => ({ data: null, status: "unauthenticated" }),
}));

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
    <NavControllerProvider>
      <NavDesktop menu={menu} childrenMap={childrenMap} />
    </NavControllerProvider>,
  );
}

describe("NavDesktop touch triggers", () => {
  it("keeps a persona menu open after a touch tap compatibility click", () => {
    renderDesktopNav();

    const trigger = screen.getByTestId("nav-top-tullyelly");
    fireEvent.pointerDown(trigger, { pointerType: "touch" });
    fireEvent.mouseEnter(trigger);
    fireEvent.click(trigger);

    expect(screen.getByRole("link", { name: "ruins" })).toBeInTheDocument();
  });
});
