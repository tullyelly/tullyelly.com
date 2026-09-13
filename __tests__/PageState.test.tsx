import { render, screen } from "@testing-library/react";

import { PageState } from "@/components/ui/PageState";
import ChronicleNotFound from "@/app/shaolin/not-found";

describe("PageState", () => {
  it("connects its heading and supporting text to the state region", () => {
    render(
      <PageState
        role="alert"
        title="Unable to load"
        description="Try again shortly."
        actions={<button type="button">Retry</button>}
      />,
    );

    const state = screen.getByRole("alert");
    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Unable to load",
    });

    expect(state).toHaveAttribute("aria-live", "assertive");
    expect(state).toHaveAttribute("aria-labelledby", heading.id);
    expect(state).toHaveAccessibleDescription("Try again shortly.");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("supports a polite status and hides decorative visuals", () => {
    render(
      <PageState
        role="status"
        visual={<span data-testid="visual">!</span>}
        title="Nothing here yet"
      />,
    );

    const state = screen.getByRole("status");

    expect(state).toHaveAttribute("aria-live", "polite");
    expect(screen.getByTestId("visual").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(state).not.toHaveAttribute("aria-describedby");
  });

  it("keeps the Chronicle not-found action label visible", () => {
    render(<ChronicleNotFound />);

    expect(
      screen.getByRole("link", { name: "Back to chronicles" }).firstChild,
    ).toHaveClass("text-white");
  });
});
