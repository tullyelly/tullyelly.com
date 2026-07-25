import { render, screen } from "@testing-library/react";

import ProductionPageLink, {
  getProductionHref,
} from "@/components/layout/ProductionPageLink";

describe("ProductionPageLink", () => {
  it("links the current local path and query to production", async () => {
    window.history.replaceState({}, "", "/cardattack/homies?trend=up&page=2");

    render(<ProductionPageLink />);

    expect(
      await screen.findByRole("link", {
        name: "View this page in production",
      }),
    ).toHaveAttribute(
      "href",
      "https://tullyelly.com/cardattack/homies?trend=up&page=2",
    );
  });

  it("does not link to production when already on the production hostname", () => {
    expect(
      getProductionHref(
        new URL("http://tullyelly.com:3000/cardattack/homies?trend=up"),
      ),
    ).toBeNull();
  });
});
