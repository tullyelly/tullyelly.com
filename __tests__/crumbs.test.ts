import type { Crumb } from "@/lib/breadcrumbs/types";
import {
  ensureSingleHome,
  normalizePathForCrumbs,
} from "@/lib/breadcrumbs/utils";

describe("normalizePathForCrumbs", () => {
  it("returns root for empty input", () => {
    expect(normalizePathForCrumbs("")).toBe("/");
  });

  it("trims trailing slashes and query parameters", () => {
    expect(normalizePathForCrumbs("/mark2///?foo=bar")).toBe("/mark2");
  });

  it("maps landing pages to their section root", () => {
    expect(normalizePathForCrumbs("/mark2/blueprint")).toBe("/mark2");
    expect(normalizePathForCrumbs("/mark2/blueprint/?utm=test")).toBe("/mark2");
  });
});

describe("ensureSingleHome", () => {
  it("adds a Home crumb when missing", () => {
    const crumbs: Crumb[] = [{ label: "mark2", href: "/mark2" }];
    expect(ensureSingleHome(crumbs)).toEqual([
      { label: "Home", href: "/", kind: "root" },
      { label: "mark2", href: "/mark2" },
    ]);
  });

  it("deduplicates multiple Home crumbs and preserves other entries", () => {
    const crumbs: Crumb[] = [
      { label: "Home", href: "/" },
      { label: "home", href: "/" },
      { label: "mark2", href: "/mark2" },
    ];
    expect(ensureSingleHome(crumbs)).toEqual([
      { label: "Home", href: "/", kind: "root" },
      { label: "mark2", href: "/mark2" },
    ]);
  });
});
