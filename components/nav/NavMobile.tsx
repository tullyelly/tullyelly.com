"use client";

import * as React from "react";
import { Drawer } from "vaul";

function NavMobile(): React.JSX.Element {
  return (
    <div className="md:hidden">
      <Drawer.Root>
        <Drawer.Trigger aria-label="Open menu">Menu</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 rounded-t-2xl bg-background p-4">
            {/* wired via config soon */}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

export default NavMobile;
