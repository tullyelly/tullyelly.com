process.env.NEXT_PUBLIC_TEST_MODE = "1";
process.env.TEST_MODE = "1";

import React from "react";
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  vi,
} from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

type EventName = import("@/lib/analytics").EventName;

type CommandMenuModule = typeof import("@/components/nav/CommandMenu");

let NavDesktop: (typeof import("@/components/nav/NavDesktop"))["default"];
let NavMobile: (typeof import("@/components/nav/NavMobile"))["default"];
let CommandMenu: CommandMenuModule["default"];
let CommandMenuProvider: CommandMenuModule["CommandMenuProvider"];
let TEST_MENU_ITEMS: (typeof import("@/lib/menu.test-data"))["TEST_MENU_ITEMS"];
let setAnalyticsRecorder: (typeof import("@/lib/analytics"))["setAnalyticsRecorder"];

expect.extend(toHaveNoViolations);

vi.mock("next/link", () => {
  return {
    __esModule: true,
    default: ({
      children,
      href,
      onClick,
      prefetch: _prefetch,
      ...props
    }: any) => {
      const resolved =
        typeof href === "string" ? href : (href?.pathname ?? "#");
      const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        event.preventDefault();
      };
      return React.createElement(
        "a",
        { href: resolved, ...props, onClick: handleClick },
        children,
      );
    },
  };
});

vi.mock("next/navigation", () => {
  return {
    usePathname: () => "/menu-test",
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () => new URLSearchParams(""),
  };
});

beforeAll(async () => {
  const [
    { default: navDesktop },
    { default: navMobile },
    commandMenuModule,
    menuData,
    analyticsModule,
  ] = await Promise.all([
    import("@/components/nav/NavDesktop"),
    import("@/components/nav/NavMobile"),
    import("@/components/nav/CommandMenu"),
    import("@/lib/menu.test-data"),
    import("@/lib/analytics"),
  ]);

  NavDesktop = navDesktop;
  NavMobile = navMobile;
  CommandMenu = commandMenuModule.default;
  CommandMenuProvider = commandMenuModule.CommandMenuProvider;
  TEST_MENU_ITEMS = menuData.TEST_MENU_ITEMS;
  setAnalyticsRecorder = analyticsModule.setAnalyticsRecorder;
});

type Recorded = { name: EventName; props: Record<string, unknown> };

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <CommandMenuProvider items={TEST_MENU_ITEMS}>
      {children}
    </CommandMenuProvider>
  );
}

describe("navigation analytics instrumentation", () => {
  let events: Recorded[];

  beforeEach(() => {
    events = [];
    setAnalyticsRecorder((event) => {
      events.push(event);
    });
    const scope = globalThis as typeof globalThis & { localStorage?: Storage };
    scope.localStorage?.clear?.();
  });

  afterEach(() => {
    setAnalyticsRecorder(null);
    events = [];
    cleanup();
  });

  it("tracks desktop hover open and click, with accessible markup", async () => {
    const { container } = render(
      <Wrapper>
        <NavDesktop items={TEST_MENU_ITEMS} />
      </Wrapper>,
    );

    const trigger = await screen.findByTestId("persona-trigger-persona.mark2");
    fireEvent.pointerEnter(trigger);

    await waitFor(() => {
      expect((globalThis as any).__navTest?.openPersona).toBeTypeOf("function");
    });

    (globalThis as any).__navTest.openPersona("persona.mark2");

    await waitFor(() => {
      expect(events.some((event) => event.name === "menu.desktop.open")).toBe(
        true,
      );
    });

    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="menu-item-menu.mark2.scrolls"]'),
      ).toBeTruthy();
    });

    const menuItem = document.querySelector(
      '[data-testid="menu-item-menu.mark2.scrolls"]',
    ) as HTMLElement;
    fireEvent.click(menuItem);

    await waitFor(() => {
      expect(
        events.some(
          (event) =>
            event.name === "menu.desktop.click" &&
            event.props.path === "/menu-test/target",
        ),
      ).toBe(true);
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("tracks mobile drawer interactions and remains accessible", async () => {
    const { container } = render(
      <Wrapper>
        <NavMobile items={TEST_MENU_ITEMS} />
      </Wrapper>,
    );

    const openButton = screen.getByLabelText("Open menu");
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(
        events.some(
          (event) =>
            event.name === "menu.mobile.open" && event.props.state === "open",
        ),
      ).toBe(true);
    });

    const accordionTrigger = await screen.findByTestId(
      "mobile-accordion-persona.mark2",
    );
    fireEvent.click(accordionTrigger);

    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="menu-item-menu.mark2.scrolls"]'),
      ).toBeTruthy();
    });

    const menuItem = document.querySelector(
      '[data-testid="menu-item-menu.mark2.scrolls"]',
    ) as HTMLElement;
    fireEvent.click(menuItem);

    await waitFor(() => {
      expect(
        events.some(
          (event) =>
            event.name === "menu.mobile.click" &&
            event.props.path === "/menu-test/target",
        ),
      ).toBe(true);
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("tracks command menu open, search, and select with axe coverage", async () => {
    const { container } = render(
      <Wrapper>
        <CommandMenu />
      </Wrapper>,
    );

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
    );

    await waitFor(() => {
      expect(events.some((event) => event.name === "menu.cmdk.open")).toBe(
        true,
      );
    });

    const command = await screen.findByPlaceholderText(/type a page/i);
    fireEvent.change(command, { target: { value: "scrolls" } });

    await waitFor(() => {
      expect(
        events.some(
          (event) =>
            event.name === "menu.cmdk.search" &&
            Number(event.props.qLen) === "scrolls".length,
        ),
      ).toBe(true);
    });

    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="menu-item-menu.mark2.scrolls"]'),
      ).toBeTruthy();
    });

    const menuItem = document.querySelector(
      '[data-testid="menu-item-menu.mark2.scrolls"]',
    ) as HTMLElement;
    fireEvent.pointerDown(menuItem);
    fireEvent.click(menuItem);

    await waitFor(() => {
      expect(
        events.some(
          (event) =>
            event.name === "menu.cmdk.select" &&
            event.props.path === "/menu-test/target",
        ),
      ).toBe(true);
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
