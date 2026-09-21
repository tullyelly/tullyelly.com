import { render, screen } from "@testing-library/react";

import AppShell from "@/components/app-shell/AppShell";

jest.mock("@/components/app-shell/ClientAppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/breadcrumbs/Breadcrumbs", () => ({
  __esModule: true,
  default: () => <nav aria-label="Breadcrumb">Trail</nav>,
}));

jest.mock("@/components/e2e/E2EOnlyNav", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/PersistentBannerHost", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/app/_components/Footer", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/lib/breadcrumb-disable.server", () => ({
  shouldDisableGlobalBreadcrumb: async () => false,
}));

describe("AppShell breadcrumb spacing", () => {
  it("places the global breadcrumb before the padded page body", async () => {
    const view = await AppShell({
      menuItems: [],
      menu: { items: [] },
      menuChildren: {},
      siteTitle: "tullyelly",
      currentPersona: null,
      pathname: "/theabbott/crates",
      children: <h1>The Crates</h1>,
    } as unknown as Parameters<typeof AppShell>[0]);

    const { container } = render(view);
    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    const paneBody = container.querySelector("#pane-body");

    expect(paneBody).not.toBeNull();
    expect(
      breadcrumb.compareDocumentPosition(paneBody as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(paneBody).toHaveClass("pt-[var(--pane-pt)]");
  });
});
