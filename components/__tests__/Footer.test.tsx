import { render, screen, within } from "@testing-library/react";
import Footer from "@/components/Footer";
import "@testing-library/jest-dom";

describe("Footer", () => {
  it("renders a contentinfo landmark and valid links", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();

    const nav = within(footer).queryByRole("navigation");
    const linkScope = nav ?? footer;
    const links = within(linkScope).queryAllByRole("link");
    links.forEach((link) => {
      expect(link).toHaveAttribute("href");
    });
  });
});
