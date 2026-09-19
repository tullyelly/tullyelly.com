import { readFileSync } from "node:fs";

describe("global navigation breakpoints", () => {
  const appShell = readFileSync(
    "components/app-shell/ClientAppShell.tsx",
    "utf8",
  );
  const desktopNav = readFileSync("components/nav/NavDesktop.tsx", "utf8");

  it("keeps mobile navigation active below lg without a desktop overlap", () => {
    expect(appShell).toContain("backdrop-blur lg:hidden");
    expect(appShell).toContain('<div className="lg:hidden">');
    expect(appShell).not.toContain("backdrop-blur md:hidden");
    expect(desktopNav).toContain(
      "hidden bg-transparent text-white shadow-sm lg:block",
    );
    expect(desktopNav).not.toContain(
      "hidden bg-transparent text-white shadow-sm md:block",
    );
  });
});
