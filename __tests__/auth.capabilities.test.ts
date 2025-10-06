jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

import { getCapabilities } from "@/app/_auth/session";
import { getServerSession } from "next-auth/next";

describe("getCapabilities", () => {
  beforeEach(() => {
    (getServerSession as jest.Mock).mockReset();
  });

  it("builds capabilities from session features", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { features: ["menu.mark2.admin", "menu.cardattack.tcdb.rankings"] },
    });

    const capabilities = await getCapabilities();

    expect(capabilities.has("menu.mark2.admin")).toBe(true);
    expect(capabilities.has("missing.feature")).toBe(false);
  });

  it("falls back to empty set when session missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const capabilities = await getCapabilities();

    expect(capabilities.has("anything")).toBe(false);
  });
});
