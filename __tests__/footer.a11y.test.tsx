import { render, screen } from "@testing-library/react";
import Footer from "@/components/Footer";
import "@testing-library/jest-dom";

describe("Footer", () => {
  it("renders contentinfo and labeled navs", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Footer — Explore/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Footer — Support/i })).toBeInTheDocument();
  });

  it("has an email field and submit button", () => {
    render(<Footer />);
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Join/i })).toBeInTheDocument();
  });
});
