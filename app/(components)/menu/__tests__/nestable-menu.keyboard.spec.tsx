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

function KeyboardHarness() {
  const [open, setOpen] = React.useState(false);
  const aim = useMenuAim({ id: "keyboard", open, onOpenChange: setOpen });
  const triggerProps = aim.getReferenceProps<Record<string, unknown>>({});
  const floatingProps = aim.getFloatingProps<Record<string, unknown>>({});
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <div>
      <button
        data-testid="aim-trigger"
        {...(triggerProps as Record<string, unknown>)}
        ref={(node) => {
          triggerRef.current = node;
          aim.reference(node);
        }}
        onKeyDown={(event) => {
          if (
            event.key === "ArrowDown" ||
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            aim.setOpen(true);
          }
          if (event.key === "Escape") {
            event.preventDefault();
            aim.setOpen(false);
          }
        }}
        data-state={open ? "open" : "closed"}
      >
        trigger
      </button>
      <div
        data-testid="aim-panel"
        {...(floatingProps as Record<string, unknown>)}
        ref={(node) => aim.floating(node)}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            aim.setOpen(false);
          }
        }}
        data-state={open ? "open" : "closed"}
      >
        <button
          data-testid="aim-item"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              triggerRef.current?.focus();
            }
          }}
        >
          item
        </button>
      </div>
    </div>
  );
}

describe("useMenuAim keyboard affordances", () => {
  it("responds to keyboard toggles and restores focus", () => {
    const { getByTestId } = render(<KeyboardHarness />);
    const trigger = getByTestId("aim-trigger");
    const panel = getByTestId("aim-panel");
    const item = getByTestId("aim-item");
    mockRect(trigger, { x: 80, y: 80, width: 100, height: 32 });
    mockRect(panel, { x: 200, y: 112, width: 180, height: 150 });

    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(panel.getAttribute("data-state")).toBe("open");

    item.focus();
    fireEvent.keyDown(item, { key: "Escape" });

    expect(trigger).toHaveFocus();
    expect(panel.getAttribute("data-state")).toBe("closed");
  });
});
