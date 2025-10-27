// @ts-nocheck
/**
 * @jest-environment jsdom
 */

jest.mock("@radix-ui/react-dropdown-menu", () => {
  const React = require("react");
  const { createPortal } = require("react-dom");
  const MenuContext = React.createContext({
    open: false,
    setOpen: () => {},
  });

  function Root({ open: controlledOpen, onOpenChange, modal, children }) {
    const [open, setInternalOpen] = React.useState(
      typeof controlledOpen === "boolean" ? controlledOpen : false,
    );

    const setOpen = (v) => {
      setInternalOpen(v);
      onOpenChange?.(v);
    };

    return React.createElement(
      MenuContext.Provider,
      { value: { open, setOpen } },
      children,
    );
  }

  function Trigger({ __dmOpen, __dmSetOpen, children, asChild, ...rest }) {
    const ref = React.useRef(null);
    const { open: ctxOpen, setOpen: ctxSetOpen } =
      React.useContext(MenuContext);
    const open = __dmOpen ?? ctxOpen;
    const setOpen = __dmSetOpen ?? ctxSetOpen;
    const skipNextClickRef = React.useRef(false);
    const {
      onClick,
      onPointerOver,
      onPointerUp,
      onPointerLeave,
      onMouseLeave,
      ...other
    } = rest;

    const handleClick = (event) => {
      onClick?.(event);
      if (skipNextClickRef.current) {
        skipNextClickRef.current = false;
        return;
      }
      setOpen(!open);
    };

    const handlePointerOver = (event) => {
      onPointerOver?.(event);
      if (event.pointerType === "mouse") {
        // emulate hover intent: tiny timeout to simulate delay
        setTimeout(() => setOpen(true), 0);
      }
    };

    const handlePointerUp = (event) => {
      onPointerUp?.(event);
      if (event.pointerType === "touch" || event.pointerType === "pen") {
        skipNextClickRef.current = true;
        setOpen(true);
      }
    };

    const reinforceOpen = () => {
      if (open) {
        setTimeout(() => setOpen(true), 0);
      }
    };

    const handlePointerLeave = (event) => {
      onPointerLeave?.(event);
      reinforceOpen();
    };

    const handleMouseLeave = (event) => {
      onMouseLeave?.(event);
      reinforceOpen();
    };

    // emulate data-state + aria-expanded
    const props = {
      "data-state": open ? "open" : "closed",
      "aria-expanded": open ? "true" : "false",
      "aria-haspopup": "menu",
      onClick: handleClick,
      onPointerOver: handlePointerOver,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerLeave,
      onMouseLeave: handleMouseLeave,
      ...other,
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...children.props,
        ...props,
        onClick: (event) => {
          children.props?.onClick?.(event);
          props.onClick(event);
        },
        onPointerOver: (event) => {
          children.props?.onPointerOver?.(event);
          props.onPointerOver(event);
        },
        onPointerUp: (event) => {
          children.props?.onPointerUp?.(event);
          props.onPointerUp(event);
        },
        onPointerLeave: (event) => {
          children.props?.onPointerLeave?.(event);
          props.onPointerLeave(event);
        },
        onMouseLeave: (event) => {
          children.props?.onMouseLeave?.(event);
          props.onMouseLeave(event);
        },
      });
    }

    return React.createElement("button", { ref, ...props }, children);
  }

  function Portal({ __dmOpen, __dmSetOpen, children }) {
    const doc = globalThis.document;
    if (!doc) return null;
    const target = doc.getElementById("persona-menu-root") ?? doc.body ?? null;
    if (!target) return null;
    return createPortal(children, target);
  }

  function Content({ __dmOpen, children, asChild, ...rest }) {
    const { open: ctxOpen } = React.useContext(MenuContext);
    const open = __dmOpen ?? ctxOpen;
    if (!open) return null;
    const {
      sideOffset: _sideOffset,
      collisionPadding: _collisionPadding,
      align: _align,
      alignOffset: _alignOffset,
      side: _side,
      avoidCollisions: _avoidCollisions,
      onInteractOutside: _onInteractOutside,
      onEscapeKeyDown: _onEscapeKeyDown,
      onPointerDownOutside: _onPointerDownOutside,
      ...other
    } = rest;

    const contentProps = {
      ...other,
      role: "menu",
      "data-state": "open",
      hidden: open ? undefined : true,
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...children.props,
        ...contentProps,
      });
    }

    return React.createElement("div", contentProps, children);
  }

  function Item({ __dmSetOpen, onSelect, children, asChild, ...rest }) {
    const { setOpen: ctxSetOpen } = React.useContext(MenuContext);
    const setOpen = __dmSetOpen ?? ctxSetOpen;
    const handleSelect = (event) => {
      onSelect?.(event);
      setOpen(false);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...children.props,
        role: children.props?.role ?? "menuitem",
        tabIndex: children.props?.tabIndex ?? -1,
        onClick: (event) => {
          children.props?.onClick?.(event);
          handleSelect(event);
        },
        ...rest,
      });
    }

    return React.createElement(
      "div",
      {
        role: "menuitem",
        tabIndex: -1,
        onClick: handleSelect,
        ...rest,
      },
      children,
    );
  }

  return {
    __esModule: true,
    Root,
    Trigger,
    Portal,
    Content,
    Item,
    // Export names used elsewhere to avoid crashes:
    Separator: (p) => React.createElement("div", p),
    Label: (p) => React.createElement("div", p),
    Group: (p) => React.createElement("div", p),
    Sub: (p) => React.createElement(React.Fragment, p.children),
    SubTrigger: Trigger,
    SubContent: Content,
  };
});

jest.mock("@/components/ui/ShadowPortal", () => {
  const React = require("react");
  const { createPortal } = require("react-dom");

  function ShadowPortal({
    children,
    containerId = "persona-menu-root",
    onReady,
  }) {
    const [mount, setMount] = React.useState(null);

    React.useEffect(() => {
      const doc = globalThis.document;
      if (!doc) return undefined;
      let host = doc.getElementById(containerId);
      if (!host) {
        host = doc.createElement("div");
        host.id = containerId;
        doc.body?.appendChild(host);
      }
      const mountEl = doc.createElement("div");
      mountEl.setAttribute("data-testid", "menu-portal-root");
      host.appendChild(mountEl);
      setMount(mountEl);
      onReady?.({ shadowRoot: host, mount: mountEl });
      return () => {
        onReady?.(null);
        if (mountEl.parentNode === host) {
          host.removeChild(mountEl);
        }
        setMount(null);
      };
    }, [containerId, onReady]);

    return mount ? createPortal(children, mount) : null;
  }

  return {
    __esModule: true,
    default: ShadowPortal,
    PERSONA_MENU_CSS: "",
  };
});

jest.mock("next/navigation", () => {
  const makeSearch = () => new URLSearchParams("");
  return {
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }),
    usePathname: () => "/__test__",
    useSearchParams: () => makeSearch(),
  };
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import type { PersonaItem } from "@/types/nav";

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

function ensurePortalRoot() {
  const doc = globalThis.document;
  if (!doc) return;
  let root = doc.getElementById("persona-menu-root");
  if (!root) {
    root = doc.createElement("div");
    root.id = "persona-menu-root";
    doc.body?.appendChild(root);
  } else {
    root.innerHTML = "";
  }
}

function setPointerMode(mode: "touch" | "mouse") {
  const win = globalThis.window as
    | { __pointerMode?: "touch" | "mouse" }
    | undefined;
  if (win) {
    win.__pointerMode = mode;
  }
}

async function renderMenu(mode: "touch" | "mouse") {
  ensurePortalRoot();
  setPointerMode(mode);
  const { default: NestableMenu } = await import("../NestableMenu");

  function MenuHarness() {
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
          }
        }}
        registerTrigger={() => {}}
        registerPointerShield={() => {}}
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

  MenuHarness.displayName = "MenuHarness";

  render(<MenuHarness />);
  const trigger = (await screen.findByTestId(
    `nav-top-${persona.persona}`,
  )) as HTMLButtonElement;
  return { trigger };
}

beforeEach(() => {
  const doc = globalThis.document;
  if (doc) {
    let root = doc.getElementById("persona-menu-root");
    if (!root) {
      root = doc.createElement("div");
      root.id = "persona-menu-root";
      doc.body?.appendChild(root);
    } else {
      root.innerHTML = "";
    }
  }
  setPointerMode("mouse");
});

describe("NestableMenu pointer modality", () => {
  it("opens via touch tap without hover intent", async () => {
    const { trigger } = await renderMenu("touch");

    fireEvent.pointerDown(trigger, {
      pointerType: "touch",
      pointerId: 1,
      bubbles: true,
    });
    fireEvent.pointerUp(trigger, {
      pointerType: "touch",
      pointerId: 1,
      bubbles: true,
    });
    fireEvent.click(trigger, { bubbles: true });
    const menu = await screen.findByRole("menu", {}, { timeout: 800 });
    expect(menu).toHaveAttribute("data-state", "open");
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(trigger, { bubbles: true });
    await waitFor(() => {
      expect(screen.queryByRole("menu")).toBeNull();
    });
  });

  it("opens on mouse hover", async () => {
    const { trigger } = await renderMenu("mouse");

    fireEvent.pointerOver(trigger, { pointerType: "mouse" });

    const menu = await screen.findByRole("menu", {}, { timeout: 800 });
    expect(menu).toHaveAttribute("data-state", "open");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("locks open on mouse click until dismissed", async () => {
    const { trigger } = await renderMenu("mouse");

    fireEvent.click(trigger);

    const menu = await screen.findByRole("menu", {}, { timeout: 800 });
    expect(menu).toHaveAttribute("data-state", "open");
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.pointerLeave(trigger, { pointerType: "mouse" });
    fireEvent.mouseLeave(trigger);

    expect(screen.getByRole("menu")).toHaveAttribute("data-state", "open");

    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.queryByRole("menu")).toBeNull();
    });
  });
});
