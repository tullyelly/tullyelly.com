export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import BreadcrumbRegister from "@/components/breadcrumb/BreadcrumbRegister";
import type { Crumb } from "@/lib/breadcrumb-registry";

export const breadcrumb: readonly Crumb[] = [{ label: "home" } as const];

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <>
      <BreadcrumbRegister items={breadcrumb} />
      <section className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold font-mono">
          ]construction in progress[
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Fresh digs are on the way; hang tight while the blog takes shape right
          here.
        </p>
      </section>
    </>
  );
}
