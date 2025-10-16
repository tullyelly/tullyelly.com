import type { Crumb } from "@/components/ui/breadcrumb";
import {
  deriveCrumbsFromPath,
  findPathByHref,
  type MenuNode,
} from "@/lib/crumbs";

const menuRoot: MenuNode = {
  id: "__root__",
  label: "home",
  href: "/",
  children: [
    {
      id: "mark2",
      label: "mark2",
      href: "/mark2",
      children: [
        {
          id: "shaolin",
          label: "Shaolin Scrolls",
          href: "/mark2/shaolin-scrolls",
        },
        {
          id: "blueprint",
          label: "blueprint",
          href: "/mark2/blueprint",
        },
        {
          id: "secret",
          label: "Secret Ops",
          href: "/mark2/secret",
          gated: true,
        },
      ],
    },
  ],
};

describe("findPathByHref", () => {
  it("returns the node path for a matching href", () => {
    const path = findPathByHref(menuRoot, "/mark2/blueprint");
    expect(path?.map((node) => node.id)).toEqual([
      "__root__",
      "mark2",
      "blueprint",
    ]);
  });

  it("returns null when href is not present", () => {
    const path = findPathByHref(menuRoot, "/unknown/path");
    expect(path).toBeNull();
  });
});

describe("deriveCrumbsFromPath", () => {
  it("returns ancestor crumbs with last item unlinked", () => {
    const crumbs = deriveCrumbsFromPath(menuRoot, "/mark2/shaolin-scrolls");
    expect(crumbs).toEqual([
      { label: "home", href: "/" },
      { label: "mark2", href: "/mark2" },
      { label: "Shaolin Scrolls" },
    ]);
  });

  it("falls back to pathname segments when menu entry is missing", () => {
    const crumbs = deriveCrumbsFromPath(menuRoot, "/mark2/unlisted-area");
    expect(crumbs).toEqual([
      { label: "home", href: "/" },
      { label: "Mark2", href: "/mark2" },
      { label: "Unlisted Area" },
    ]);
  });

  it("omits gated nodes from the crumb trail", () => {
    const crumbs = deriveCrumbsFromPath(menuRoot, "/mark2/secret");
    expect(crumbs).toEqual([{ label: "home", href: "/" }, { label: "mark2" }]);
  });
});
