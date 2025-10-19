/**
 * @jest-environment jsdom
 */

import { render, fireEvent, act, screen } from "@testing-library/react";
import * as React from "react";
import { useMenuAim } from "../useMenuAim";

function mockRect(
  element: Element,
  rect: { x: number; y: number; width: number; height: number },
) {
  Object.defineProperty(element, "getBoundingClientRect", {
    configurable: true,
    value: () =>
      ({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.y,
        left: rect.x,
        right: rect.x + rect.width,
        bottom: rect.y + rect.height,
        toJSON() {
          return this;
        },
      }) as DOMRect,
  });
}

function AimHarness({
  openDelay = 100,
  closeDelay = 160,
  buffer = 6,
  enabled = true,
  initialOpen = false,
}: {
  openDelay?: number;
  closeDelay?: number;
  buffer?: number;
  enabled?: boolean;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(initialOpen);
  const aim = useMenuAim({
    id: "demo",
    open,
    onOpenChange: setOpen,
    openDelay,
    closeDelay,
    buffer,
    enabled,
  });
  const triggerProps = aim.getReferenceProps<Record<string, unknown>>({}) ?? {};
  const floatingProps = aim.getFloatingProps<Record<string, unknown>>({}) ?? {};

  return (
    <>
      <button
        data-testid="aim-trigger"
        {...(triggerProps as Record<string, unknown>)}
        ref={(node) => aim.reference(node)}
        data-state={open ? "open" : "closed"}
      >
        trigger
      </button>
      <div
        data-testid="aim-panel"
        {...(floatingProps as Record<string, unknown>)}
        ref={(node) => aim.floating(node)}
        data-state={open ? "open" : "closed"}
      >
        panel
      </div>
    </>
  );
}

describe("useMenuAim hover intent", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps the target open while moving diagonally toward the panel", async () => {
    render(<AimHarness initialOpen />);
    const trigger = screen.getByTestId("aim-trigger");
    const panel = screen.getByTestId("aim-panel");
    mockRect(trigger, { x: 100, y: 100, width: 120, height: 32 });
    mockRect(panel, { x: 200, y: 132, width: 240, height: 200 });

    expect(panel.getAttribute("data-state")).toBe("open");

    await act(async () => {
      fireEvent.pointerEnter(trigger, {
        clientX: 110,
        clientY: 110,
        pointerType: "mouse",
      });
      for (let step = 0; step <= 12; step += 1) {
        const clientX = 110 + step * 10;
        const clientY = 110 + step * 8;
        fireEvent.pointerMove(document, {
          clientX,
          clientY,
          pointerType: "mouse",
        });
        jest.advanceTimersByTime(8);
      }
    });

    expect(panel.getAttribute("data-state")).toBe("open");
  });
});
