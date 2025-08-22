import { render, screen } from "@testing-library/react";
import SiteHeader from "@/components/SiteHeader";
import "@testing-library/jest-dom";

describe("SiteHeader navigation", () => {
  it("includes Typography demo link", () => {
    render(<SiteHeader />);
    const typographyLink = screen.getByRole("link", { name: "Typography" });
    expect(typographyLink).toHaveAttribute("href", "/typography-demo");
  });
});
