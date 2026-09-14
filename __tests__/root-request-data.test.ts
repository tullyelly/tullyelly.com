const headersMock = jest.fn();
const getMenuMock = jest.fn();
const getCapabilitiesMock = jest.fn();
const resolvePersonaForPathMock = jest.fn();
const buildMenuTreeMock = jest.fn();

jest.mock("react", () => {
  const actual = jest.requireActual<typeof import("react")>("react");
  return {
    ...actual,
    cache: (loader: () => unknown) => {
      let result: unknown;
      return () => {
        result ??= loader();
        return result;
      };
    },
  };
});

jest.mock("next/headers", () => ({
  headers: () => headersMock(),
}));

jest.mock("@/app/_auth/session", () => ({
  getCapabilities: () => getCapabilitiesMock(),
}));

jest.mock("@/lib/escape-hatches", () => ({
  isBreadcrumbDebugAllowed: () => true,
}));

jest.mock("@/lib/menu/getMenu", () => ({
  getMenu: () => getMenuMock(),
}));

jest.mock("@/lib/menu/persona", () => ({
  resolvePersonaForPath: (...args: unknown[]) =>
    resolvePersonaForPathMock(...args),
}));

jest.mock("@/lib/menu/tree", () => ({
  buildMenuTree: (...args: unknown[]) => buildMenuTreeMock(...args),
}));

import {
  getRootRequestData,
  resolveRequestedPath,
} from "@/lib/root-request-data";

describe("root request data", () => {
  it("resolves the first supported pathname header", () => {
    const values = new Headers({
      "next-url": "/fallback",
      "x-pathname": "/preferred",
    });

    expect(resolveRequestedPath(values)).toBe("/preferred");
    expect(resolveRequestedPath(new Headers())).toBe("/");
  });

  it("shares metadata and layout work within one request", async () => {
    const headersList = new Headers({
      "x-pathname": "/cardattack",
      "x-next-url": "/cardattack?debugBreadcrumb=1",
    });
    const tree = [{ id: "persona.cardattack", kind: "persona" }];
    const index = { byPath: new Map(), parents: new Map() };
    const capabilities = { all: new Set(["menu.cardattack"]), has: jest.fn() };
    const currentPersona = { persona: "cardattack" };
    const menuTree = [{ id: 1, label: "CardAttack" }];
    headersMock.mockResolvedValue(headersList);
    getMenuMock.mockResolvedValue({ tree, index });
    getCapabilitiesMock.mockResolvedValue(capabilities);
    resolvePersonaForPathMock.mockReturnValue(currentPersona);
    buildMenuTreeMock.mockReturnValue(menuTree);

    const metadataData = await getRootRequestData();
    const layoutData = await getRootRequestData();

    expect(layoutData).toBe(metadataData);
    expect(headersMock).toHaveBeenCalledTimes(1);
    expect(getMenuMock).toHaveBeenCalledTimes(1);
    expect(getCapabilitiesMock).toHaveBeenCalledTimes(1);
    expect(resolvePersonaForPathMock).toHaveBeenCalledWith(tree, "/cardattack");
    expect(buildMenuTreeMock).toHaveBeenCalledWith(tree);
    expect(layoutData).toMatchObject({
      pathname: "/cardattack",
      currentPersona,
      personaKey: "cardattack",
      breadcrumbDebugForced: true,
      menuTree,
    });
  });
});
