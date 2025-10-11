"use client";

import * as React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function HeaderShell({ children, className }: Props) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const update = () => {
      const root = document.documentElement;
      const header = ref.current;
      const h = header?.getBoundingClientRect().height ?? 64;
      root.style.setProperty("--header-h", `${Math.round(h)}px`);

      if (header) {
        const bg = getComputedStyle(header).backgroundColor || "#1d4ed8";
        root.style.setProperty("--brand", bg);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, []);

  const headerClassName = ["site-header", className].filter(Boolean).join(" ");

  return (
    <header ref={ref} className={headerClassName} id="site-header">
      {children}
    </header>
  );
}
