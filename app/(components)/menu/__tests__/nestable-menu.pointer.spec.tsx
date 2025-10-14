/**
 * @jest-environment jsdom
 */

import {
  act,
  fireEvent,
  render,
  waitFor,
  screen,
} from "@testing-library/react";
import * as React from "react";
import NestableMenu from "../NestableMenu";
import type { PersonaItem } from "@/types/nav";

const globalObject = globalThis as typeof globalThis & {
  PointerEvent?: typeof PointerEvent;
};

if (globalObject.PointerEvent === undefined) {
  class TestPointerEvent extends MouseEvent {
    pointerType: string;
    pointerId: number;

    constructor(
      type: string,
      init: MouseEventInit & { pointerType?: string; pointerId?: number } = {},
    ) {
      super(type, init);
      this.pointerType = init.pointerType ?? "mouse";
      this.pointerId = init.pointerId ?? 1;
    }
  }

  try {
    Object.defineProperty(globalObject, "PointerEvent", {
      value: TestPointerEvent,
      configurable: true,
      writable: true,
    });
  } catch {
    (globalObject as any).PointerEvent = TestPointerEvent;
  }
}

const persona: PersonaItem = {
  id: "persona.mark2",
  kind: "persona",
  persona: "mark2",
  label: "mark2",
  icon: "Brain",
  children: [
    {
      id: "mark2-scrolls",
      kind: "link",
      label: "Shaolin Scrolls",
      href: "/menu-test/target",
      featureKey: "menu.mark2.scrolls",
    },
  ],
};

function Harness({
  onStateChange,
  onGuardChange,
}: {
  onStateChange?: (open: boolean) => void;
  onGuardChange?: (guard: (() => boolean) | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const headerRef = React.useRef<HTMLElement | null>(null);

  return (
    <NestableMenu
      persona={persona}
      pathname="/menu-test"
      isOpen={open}
      onOpenChange={(id, next) => {
        if (id === persona.id) {
          setOpen(next);
          onStateChange?.(next);
        }
      }}
      registerTrigger={() => {}}
      registerPointerShield={(_, guard) => {
        onGuardChange?.(guard ?? null);
      }}
      focusTrigger={() => {}}
      onTriggerKeyDown={() => {}}
      onLinkClick={() => {}}
      headerRef={headerRef}
      prefersReducedMotion
      aimOpenDelay={0}
      aimCloseDelay={0}
      aimBuffer={0}
    />
  );
}

function getMenuElement() {
  return document.querySelector(
    `[data-persona-menu="${persona.id}"]`,
  ) as HTMLElement | null;
}

describe("NestableMenu pointer modality", () => {
  it("toggles open/closed via touch pointer without invoking hover intent", async () => {
    const stateChanges: boolean[] = [];
    let guard: (() => boolean) | null = null;
    render(
      <Harness
        onStateChange={(next) => stateChanges.push(next)}
        onGuardChange={(next) => {
          guard = next;
        }}
      />,
    );
    const trigger = (await screen.findByTestId(
      `persona-trigger-${persona.id}`,
    )) as HTMLButtonElement;

    // pointer hover from touch should not open the menu
    await act(async () => {
      fireEvent.pointerOver(trigger, {
        pointerType: "touch",
        pointerId: 1,
        clientX: 100,
        clientY: 40,
        bubbles: true,
      });
      fireEvent.mouseOver(trigger, {
        clientX: 100,
        clientY: 40,
        bubbles: true,
      });
      fireEvent.pointerEnter(trigger, {
        pointerType: "touch",
        pointerId: 1,
        clientX: 100,
        clientY: 40,
        bubbles: true,
      });
    });
    await waitFor(() => {
      expect(getMenuElement()).toBeNull();
    });

    await act(async () => {
      fireEvent.pointerDown(trigger, {
        pointerType: "touch",
        pointerId: 1,
        clientX: 100,
        clientY: 40,
        bubbles: true,
      });
      fireEvent.pointerUp(trigger, {
        pointerType: "touch",
        pointerId: 1,
        clientX: 100,
        clientY: 40,
        bubbles: true,
      });
    });
    await waitFor(() => {
      expect(stateChanges.at(-1)).toBe(true);
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
    });
    await waitFor(() => {
      const menu = getMenuElement();
      expect(menu).toBeTruthy();
      expect(menu?.getAttribute("data-state")).toBe("open");
    });
    expect(trigger.dataset.pointerLocked).toBe("true");
    expect(typeof guard).toBe("function");

    await act(async () => {
      fireEvent.pointerDown(trigger, {
        pointerType: "touch",
        pointerId: 1,
        clientX: 100,
        clientY: 40,
        bubbles: true,
      });
      fireEvent.pointerUp(trigger, {
        pointerType: "touch",
        pointerId: 1,
        clientX: 100,
        clientY: 40,
        bubbles: true,
      });
    });
    await waitFor(() => {
      expect(stateChanges.at(-1)).toBe(false);
      const menu = getMenuElement();
      if (menu) {
        expect(menu.getAttribute("data-state")).toBe("closed");
        expect(menu.hasAttribute("hidden")).toBe(true);
      } else {
        expect(menu).toBeNull();
      }
    });
    expect(trigger.dataset.pointerLocked).toBeUndefined();
  });

  it("keeps hover-to-open behaviour for mouse pointers", async () => {
    const stateChanges: boolean[] = [];
    render(<Harness onStateChange={(next) => stateChanges.push(next)} />);
    const trigger = (await screen.findByTestId(
      `persona-trigger-${persona.id}`,
    )) as HTMLButtonElement;

    await act(async () => {
      fireEvent.pointerOver(trigger, {
        pointerType: "mouse",
        pointerId: 2,
        clientX: 120,
        clientY: 80,
        bubbles: true,
      });
      fireEvent.mouseOver(trigger, {
        clientX: 120,
        clientY: 80,
        bubbles: true,
      });
      fireEvent.pointerEnter(trigger, {
        pointerType: "mouse",
        pointerId: 2,
        clientX: 120,
        clientY: 80,
        bubbles: true,
      });
      fireEvent.mouseEnter(trigger, {
        clientX: 120,
        clientY: 80,
        bubbles: true,
      });
    });

    await waitFor(() => {
      expect(stateChanges.at(-1)).toBe(true);
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
    });

    await waitFor(() => {
      const menu = getMenuElement();
      expect(menu).toBeTruthy();
      expect(menu?.getAttribute("data-state")).toBe("open");
    });

    await act(async () => {
      fireEvent.pointerLeave(trigger, {
        pointerType: "mouse",
        pointerId: 2,
        clientX: 20,
        clientY: 20,
        bubbles: true,
      });
      fireEvent.mouseLeave(trigger, {
        clientX: 20,
        clientY: 20,
        bubbles: true,
      });
    });

    await waitFor(() => {
      expect(stateChanges.at(-1)).toBe(false);
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      const menu = getMenuElement();
      if (menu) {
        expect(menu.getAttribute("data-state")).toBe("closed");
        expect(menu.hasAttribute("hidden")).toBe(true);
      } else {
        expect(menu).toBeNull();
      }
    });
  });

  it("locks open on mouse click until explicit dismissal", async () => {
    const stateChanges: boolean[] = [];
    render(<Harness onStateChange={(next) => stateChanges.push(next)} />);
    const trigger = (await screen.findByTestId(
      `persona-trigger-${persona.id}`,
    )) as HTMLButtonElement;
    const clickTrigger = async (
      pointerId: number,
      point: { x: number; y: number },
    ) => {
      await act(async () => {
        fireEvent.pointerDown(trigger, {
          pointerType: "mouse",
          pointerId,
          button: 0,
          clientX: point.x,
          clientY: point.y,
          bubbles: true,
        });
        fireEvent.pointerUp(trigger, {
          pointerType: "mouse",
          pointerId,
          button: 0,
          clientX: point.x,
          clientY: point.y,
          bubbles: true,
        });
        fireEvent.click(trigger, {
          button: 0,
          clientX: point.x,
          clientY: point.y,
          bubbles: true,
        });
      });
    };

    const moveAway = async (pointerId: number) => {
      await act(async () => {
        fireEvent.pointerOut(trigger, {
          pointerType: "mouse",
          pointerId,
          clientX: 24,
          clientY: 12,
          bubbles: true,
        });
        fireEvent.mouseOut(trigger, {
          clientX: 24,
          clientY: 12,
          bubbles: true,
        });
        fireEvent.pointerLeave(trigger, {
          pointerType: "mouse",
          pointerId,
          clientX: 24,
          clientY: 12,
          bubbles: true,
        });
        fireEvent.mouseLeave(trigger, {
          clientX: 24,
          clientY: 12,
          bubbles: true,
        });
      });
    };

    await clickTrigger(4, { x: 128, y: 88 });

    await waitFor(() => {
      expect(stateChanges.at(-1)).toBe(true);
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
    });

    await moveAway(4);

    await waitFor(() => {
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
    });

    await clickTrigger(4, { x: 134, y: 94 });

    await waitFor(() => {
      expect(stateChanges.at(-1)).toBe(false);
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
    });

    await clickTrigger(5, { x: 140, y: 98 });

    await waitFor(() => {
      expect(stateChanges.at(-1)).toBe(true);
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
    });

    await moveAway(5);

    await waitFor(() => {
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
    });

    await clickTrigger(5, { x: 100, y: 64 });

    await waitFor(() => {
      expect(stateChanges.at(-1)).toBe(false);
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
    });
  });
});
