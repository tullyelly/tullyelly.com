import { render } from "@testing-library/react";

import FullBleedPage from "@/components/layout/FullBleedPage";

describe("FullBleedPage", () => {
  it("keeps the default desktop width cap", () => {
    const { container } = render(
      <FullBleedPage>
        <div>content</div>
      </FullBleedPage>,
    );

    const article = container.querySelector("article") as HTMLElement;
    expect(article).toHaveClass("md:max-w-3xl");
  });

  it("allows page-specific desktop width overrides", () => {
    const { container } = render(
      <FullBleedPage articleClassName="md:max-w-[var(--content-max)]">
        <div>content</div>
      </FullBleedPage>,
    );

    const article = container.querySelector("article") as HTMLElement;
    expect(article).toHaveClass("md:max-w-[var(--content-max)]");
  });
});
