import React from "react";
import { render } from "@testing-library/react";
import Footer from "@/components/Footer";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

it("has no obvious accessibility violations", async () => {
  const { container } = render(<Footer />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
