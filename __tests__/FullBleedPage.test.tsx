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

  it("supports the explicit standard width", () => {
    const { container } = render(
      <FullBleedPage width="standard">
        <div>content</div>
      </FullBleedPage>,
    );

    const article = container.querySelector("article") as HTMLElement;
    expect(article).toHaveClass("md:max-w-[var(--content-max)]");
  });

  it("marks wide pages so the application shell can expand", () => {
    const { container } = render(
      <FullBleedPage width="wide">
        <div>content</div>
      </FullBleedPage>,
    );

    expect(container.firstElementChild).toHaveAttribute(
      "data-content-width",
      "wide",
    );
    expect(container.querySelector("article")).toHaveClass("md:max-w-[76rem]");
  });
});
