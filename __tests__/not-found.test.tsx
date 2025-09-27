import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import NotFound from "@/app/not-found";

describe("Global not found page", () => {
  it("renders fallback message and navigation link", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { name: "Page Not Found", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) =>
        content.includes("We could not find the page you requested;"),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go Home" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
