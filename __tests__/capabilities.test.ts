import { buildCapabilities } from "@/app/_auth/capabilities";

describe("buildCapabilities", () => {
  it("stores unique capability keys with trimming", () => {
    const capabilities = buildCapabilities([
      " menu.view ",
      "menu.view",
      " ",
      "menu.edit",
    ]);
    expect(Array.from(capabilities.all)).toEqual(["menu.view", "menu.edit"]);
  });

  it("supports Set inputs and checks membership", () => {
    const capabilities = buildCapabilities(new Set(["alpha", "beta"]));
    expect(capabilities.has("alpha")).toBe(true);
    expect(capabilities.has("beta")).toBe(true);
    expect(capabilities.has("gamma")).toBe(false);
  });
});
