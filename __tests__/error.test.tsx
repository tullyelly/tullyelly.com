import { fireEvent, render, screen } from "@testing-library/react";

import GlobalError from "@/app/error";

describe("Global error boundary", () => {
  const error = Object.assign(new Error("Database connection failed"), {
    digest: "private-digest",
  });

  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders a concise accessible error message", () => {
    render(<GlobalError error={error} reset={jest.fn()} />);

    const alert = screen.getByRole("alert");
    const heading = screen.getByRole("heading", {
      level: 1,
      name: "We could not load this page",
    });

    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveAttribute("aria-labelledby", heading.id);
    expect(alert).toHaveAccessibleDescription(
      "Try again to reload the page content.",
    );
    expect(alert).toHaveTextContent("Something failed");
    expect(alert).not.toHaveTextContent(error.message);
    expect(alert).not.toHaveTextContent(error.digest);
  });

  it("retries through the provided reset callback", () => {
    const reset = jest.fn();
    render(<GlobalError error={error} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("does not recreate application shell landmarks or ids", () => {
    const { container } = render(
      <GlobalError error={error} reset={jest.fn()} />,
    );

    expect(container.querySelector("header")).not.toBeInTheDocument();
    expect(container.querySelector("nav")).not.toBeInTheDocument();
    expect(container.querySelector("main")).not.toBeInTheDocument();
    expect(container.querySelector("footer")).not.toBeInTheDocument();
    expect(container.querySelector("#page-root")).not.toBeInTheDocument();
    expect(container.querySelector("#page-main")).not.toBeInTheDocument();
    expect(container.querySelector("#content-pane")).not.toBeInTheDocument();
    expect(container.querySelector("#pane-body")).not.toBeInTheDocument();
  });
});
