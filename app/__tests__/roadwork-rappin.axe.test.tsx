import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import Page from "../roadwork-rappin/page";

describe("Roadwork Rappin’ page", () => {
  it("has no obvious accessibility violations", async () => {
    const { container, getByRole, getByText } = render(<Page />);
    expect(getByRole("main")).toBeInTheDocument();
    expect(getByText("Roadwork Rappin’")).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
