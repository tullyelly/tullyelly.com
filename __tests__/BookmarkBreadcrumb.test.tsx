import { render, screen } from "@testing-library/react";

import BookmarkBreadcrumb from "@/components/breadcrumb/BookmarkBreadcrumb";

describe("BookmarkBreadcrumb", () => {
  it("participates in layout so page content clears wrapped trails", () => {
    render(
      <BookmarkBreadcrumb
        items={[
          { label: "home", href: "/" },
          { label: "theabbott", href: "/theabbott" },
          { label: "cipher", href: "/theabbott/cipher" },
          { label: "crates" },
        ]}
      />,
    );

    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(breadcrumb).toHaveClass("relative", "w-fit");
    expect(breadcrumb).not.toHaveClass("absolute");
  });
});
