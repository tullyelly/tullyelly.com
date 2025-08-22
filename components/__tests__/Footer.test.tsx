import { render, screen, within } from "@testing-library/react";
import Footer from "@/components/Footer";
import "@testing-library/jest-dom";

describe("Footer", () => {
  it("renders footer landmark and valid links", () => {
    render(<Footer />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();

    const nav = within(footer).queryByRole("navigation");
    if (nav) {
      expect(nav).toBeInTheDocument();
    }

    const scope = nav ?? footer;
    const links = within(scope).getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href");
      expect(link.getAttribute("href")).not.toEqual("");
    }
  });
});
