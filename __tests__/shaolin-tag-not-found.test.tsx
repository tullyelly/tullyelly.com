import { render, screen } from "@testing-library/react";
import ShaolinNotFound from "@/app/shaolin/not-found";
import TagNotFound from "@/app/shaolin/tags/not-found";

describe("Shaolin not-found states", () => {
  it("returns a missing tag to the Chronicle tag directory", () => {
    render(<TagNotFound />);
    expect(
      screen.getByRole("heading", { name: "Tag not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to Chronicle tags" }),
    ).toHaveAttribute("href", "/shaolin/tags");
  });

  it("continues returning a missing Chronicle to the Chronicle archive", () => {
    render(<ShaolinNotFound />);
    expect(
      screen.getByRole("link", { name: "Back to chronicles" }),
    ).toHaveAttribute("href", "/shaolin");
  });
});
