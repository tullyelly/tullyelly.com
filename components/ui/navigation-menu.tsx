import * as React from "react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, style, ...props }, ref) => {
  const internalRef = React.useRef<React.ElementRef<
    typeof NavigationMenuPrimitive.Root
  > | null>(null);
  const [headerGap, setHeaderGap] = React.useState(0);

  const setRefs = React.useCallback(
    (node: React.ElementRef<typeof NavigationMenuPrimitive.Root> | null) => {
      internalRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (
          ref as React.MutableRefObject<React.ElementRef<
            typeof NavigationMenuPrimitive.Root
          > | null>
        ).current = node;
      }
    },
    [ref],
  );

  React.useEffect(() => {
    const menuNode = internalRef.current;
    if (!menuNode) return;
    const doc = menuNode.ownerDocument;
    const header = doc?.getElementById("site-header");
    if (!header) return;

    const update = () => {
      const headerRect = header.getBoundingClientRect();
      const menuRect = menuNode.getBoundingClientRect();
      const gap = Math.max(0, Math.round(headerRect.bottom - menuRect.bottom));
      setHeaderGap(gap);
    };

    update();

    const defaultView = doc?.defaultView;
    const ResizeObserverCtor =
      defaultView?.ResizeObserver ?? globalThis.ResizeObserver;
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserverCtor === "function") {
      observer = new ResizeObserverCtor(update);
      observer.observe(header);
      observer.observe(menuNode);
    }

    const handleResize = () => update();
    defaultView?.addEventListener("resize", handleResize);

    return () => {
      if (observer) observer.disconnect();
      defaultView?.removeEventListener("resize", handleResize);
    };
  }, []);

  const mergedStyle = React.useMemo<React.CSSProperties>(() => {
    const base = style ? { ...(style as React.CSSProperties) } : {};
    (base as Record<string, string | number>)["--navigation-menu-header-gap"] =
      `${headerGap}px`;
    return base;
  }, [style, headerGap]);

  return (
    <NavigationMenuPrimitive.Root
      ref={setRefs}
      className={cn(
        "relative z-10 flex max-w-max flex-1 items-center justify-center",
        className,
      )}
      style={mergedStyle}
      {...props}
    >
      {children}
      <NavigationMenuViewport />
    </NavigationMenuPrimitive.Root>
  );
});
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className,
    )}
    {...props}
  />
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

const NavigationMenuItem = NavigationMenuPrimitive.Item;

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=open]:text-accent-foreground data-[state=open]:bg-accent/50 data-[state=open]:hover:bg-accent data-[state=open]:focus:bg-accent",
);

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}{" "}
    <ChevronDown
      className="relative top-[1px] ml-1 h-3 w-3 transition duration-300 group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "left-0 top-full -mt-px w-full rounded-t-none rounded-b-2xl data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto",
      className,
    )}
    {...props}
  />
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

const NavigationMenuLink = NavigationMenuPrimitive.Link;

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div
    className={cn("absolute left-0 top-full -mt-px flex justify-start")}
    style={{
      marginTop: "calc(-1px - var(--navigation-menu-header-gap, 0px))",
    }}
  >
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "popup-weld relative h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-t-none rounded-b-2xl border-[6px] border-[var(--green)] bg-[var(--surface-card)] text-[var(--text)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  </div>
));
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName;

const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className,
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
  </NavigationMenuPrimitive.Indicator>
));
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName;

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
};
