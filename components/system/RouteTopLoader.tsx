"use client";

import NextTopLoader from "nextjs-toploader";
import { useHasReducedMotion } from "@/hooks/use-has-reduced-motion";

const TOP_LOADER_COLOR = "#00471B";
const TOP_LOADER_SHADOW = "0 0 8px #F0EBD2, 0 0 2px #F0EBD2";

export default function RouteTopLoader() {
  const prefersReducedMotion = useHasReducedMotion();

  return (
    <NextTopLoader
      color={TOP_LOADER_COLOR}
      initialPosition={0.18}
      crawlSpeed={200}
      height={3}
      crawl={!prefersReducedMotion}
      showSpinner={false}
      easing="ease"
      speed={prefersReducedMotion ? 200 : 400}
      shadow={TOP_LOADER_SHADOW}
    />
  );
}
