import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import NotFound from "@/app/not-found";

describe("Global not found page", () => {
  it("renders an accessible custom state with clear recovery paths", () => {
    const { container } = render(<NotFound />);

    const heading = screen.getByRole("heading", {
      name: "Page Not Found",
      level: 1,
    });
    expect(screen.getByRole("region")).toHaveAttribute(
      "aria-labelledby",
      heading.id,
    );
    expect(
      screen.getByText((content) =>
        content.includes("We could not find the page you requested;"),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("link", { name: "50 Piece (opens in a new tab)" }),
    ).toHaveAttribute("target", "_blank");

    const video = container.querySelector("video");
    expect(video).toHaveAttribute("aria-hidden", "true");
    expect(video).toHaveClass("motion-reduce:hidden");
  });

  it("does not recreate application shell chrome", () => {
    const { container } = render(<NotFound />);

    expect(container.querySelector("header")).not.toBeInTheDocument();
    expect(container.querySelector("nav")).not.toBeInTheDocument();
    expect(container.querySelector("main")).not.toBeInTheDocument();
    expect(container.querySelector("footer")).not.toBeInTheDocument();
    expect(container.querySelector("#page-root")).not.toBeInTheDocument();
    expect(container.querySelector("#page-main")).not.toBeInTheDocument();
  });
});
