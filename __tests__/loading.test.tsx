import { render, screen } from "@testing-library/react";

import Loading from "@/app/loading";

test("renders an accessible content-only loading state", () => {
  const { container } = render(<Loading />);
  const status = screen.getByRole("status");

  expect(status).toHaveAttribute("aria-live", "polite");
  expect(status).toHaveAttribute("aria-busy", "true");
  expect(status).toHaveTextContent("Loading page content");
  expect(
    status.querySelectorAll(
      "[aria-hidden='true'] .motion-safe\\:animate-pulse",
    ),
  ).not.toHaveLength(0);

  expect(container.querySelector("header")).not.toBeInTheDocument();
  expect(container.querySelector("footer")).not.toBeInTheDocument();
  expect(container.querySelector("main")).not.toBeInTheDocument();
  expect(container.querySelector("#page-root")).not.toBeInTheDocument();
  expect(container.querySelector("#page-main")).not.toBeInTheDocument();
  expect(container.querySelector("#content-pane")).not.toBeInTheDocument();
});
