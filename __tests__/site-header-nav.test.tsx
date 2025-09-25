import { render, screen } from "@testing-library/react";
import SiteHeader from "@/components/SiteHeader";
import "@testing-library/jest-dom";

describe("SiteHeader navigation", () => {
  it("includes top-level navigation links", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "UI Lab" })).toHaveAttribute(
      "href",
      "/ui-lab",
    );
    expect(screen.getByRole("link", { name: "Flowers" })).toHaveAttribute(
      "href",
      "/credits",
    );
  });
});
