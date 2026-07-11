import { render, screen } from "@testing-library/react";

import { ReleaseLogPagination } from "@/components/chronicles/ReleaseLogPagination";

describe("ReleaseLogPagination", () => {
  it("renders page context, date range, and order-preserving links", () => {
    render(
      <ReleaseLogPagination
        persona="unclejimmy"
        order="oldest"
        page={2}
        pageCount={4}
        dateRange={{ start: "2026-01-05", end: "2026-02-08" }}
        position="top"
      />,
    );

    expect(screen.getByRole("navigation", { name: "Top release log pagination" })).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 4")).toBeInTheDocument();
    expect(screen.getByText("Entries dated Jan 05, 2026 to Feb 08, 2026")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← Previous" })).toHaveAttribute(
      "href",
      "/unclejimmy/releases?order=oldest",
    );
    expect(screen.getByRole("link", { name: "Next →" })).toHaveAttribute(
      "href",
      "/unclejimmy/releases?page=3&order=oldest",
    );
  });

  it("omits previous and next links at a single-page boundary", () => {
    render(
      <ReleaseLogPagination
        persona="mark2"
        order="newest"
        page={1}
        pageCount={1}
        dateRange={null}
        position="bottom"
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
