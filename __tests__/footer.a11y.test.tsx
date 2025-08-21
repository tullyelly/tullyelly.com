import { render, screen } from "@testing-library/react";
import Footer from "@/components/Footer";
import "@testing-library/jest-dom";

describe("Footer", () => {
  it("renders contentinfo", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(
      screen.getByText(/tullyelly\. All rights reserved\./i)
    ).toBeInTheDocument();
  });
});
