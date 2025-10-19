/**
 * @jest-environment jsdom
 */

import { render, fireEvent } from "@testing-library/react";
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

function TouchHarness({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = React.useState(false);
  const aim = useMenuAim({ id: "touch", open, onOpenChange: setOpen, enabled });
  const triggerProps = aim.getReferenceProps<Record<string, unknown>>({});
  const floatingProps = aim.getFloatingProps<Record<string, unknown>>({});

  return (
    <div>
      <button
        data-testid="aim-trigger"
        {...(triggerProps as Record<string, unknown>)}
        ref={(node) => aim.reference(node)}
        onClick={() => aim.setOpen(!open)}
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
        content
      </div>
    </div>
  );
}

describe("useMenuAim coarse pointer behaviour", () => {
  it("falls back to click toggles when disabled", () => {
    const { getByTestId, rerender } = render(<TouchHarness enabled={false} />);
    const trigger = getByTestId("aim-trigger");
    const panel = getByTestId("aim-panel");
    mockRect(trigger, { x: 60, y: 60, width: 100, height: 32 });
    mockRect(panel, { x: 180, y: 92, width: 160, height: 140 });

    fireEvent.click(trigger);
    expect(panel.getAttribute("data-state")).toBe("open");

    fireEvent.click(trigger);
    expect(panel.getAttribute("data-state")).toBe("closed");

    rerender(<TouchHarness enabled />);
    fireEvent.pointerEnter(trigger, {
      pointerType: "mouse",
      clientX: 70,
      clientY: 70,
    });
    fireEvent.pointerLeave(trigger, {
      pointerType: "mouse",
      clientX: 10,
      clientY: 10,
    });
    expect(panel.getAttribute("data-state")).toBe("closed");
  });
});
