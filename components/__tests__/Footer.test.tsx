import { render, screen, within } from "@testing-library/react";
import Footer from "@/components/Footer";
import "@testing-library/jest-dom";

describe("Footer", () => {
  it("renders a contentinfo landmark and links with hrefs", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();

    const nav = within(footer).queryByRole("navigation");
    const scope = nav ?? footer;
    const links = within(scope).getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      const href = link.getAttribute("href");
      expect(href).toBeTruthy();
    });
  });
});
