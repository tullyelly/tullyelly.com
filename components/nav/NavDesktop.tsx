"use client";

import * as React from "react";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

function NavDesktop(): React.JSX.Element {
  return (
    <nav className="hidden md:block">
      <NavigationMenu>
        <NavigationMenuList>{/* wired via config soon */}</NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}

export default NavDesktop;
