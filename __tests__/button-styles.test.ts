import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("shared button styles", () => {
  it("keeps linked button labels visible over the blue background", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
    const buttonRule = css.match(/\.btn\s*\{([\s\S]*?)\n\s*\}/)?.[1];

    expect(buttonRule).toContain("color: var(--white) !important;");
    expect(buttonRule).toContain("text-decoration: none;");
  });
});
