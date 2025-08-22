// app/__tests__/typography.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import RootLayout from "../layout";

function Page() {
  return (
    <main>
      <h1>Typography Check</h1>
      <code className="font-mono">const x = 1;</code>
    </main>
  );
}

describe("Typography system", () => {
  it("applies Inter and JB Mono variables to <html>", () => {
<<<<<<< HEAD
    // Render RootLayout so we can inspect the <html> element it produces
    const { container } = render(<RootLayout>{<Page />}</RootLayout>);

    const html = container.querySelector("html") as HTMLHtmlElement | null;
    expect(html).not.toBeNull();

    const className = (html as HTMLHtmlElement).className;
=======
    const { container } = render(<RootLayout>{<Page />}</RootLayout>);

    // The <html> rendered by RootLayout is inside the testing container,
    // not the global document.documentElement.
    const html = container.querySelector("html") as HTMLHtmlElement | null;

    expect(html).not.toBeNull();
    const className = html?.className ?? "";

>>>>>>> origin/cipher/scaffold-ui-lab-page-and-demo-cards
    expect(className).toMatch(/--font-inter/);
    expect(className).toMatch(/--font-jbmono/);
  });

  it("exposes a usable monospace utility via Tailwind (font-mono)", () => {
    render(<Page />);
<<<<<<< HEAD
    const code = screen.getByText(/const x = 1;/i) as HTMLElement;
=======
    const code = screen.getByText(/const x = 1;/i);
>>>>>>> origin/cipher/scaffold-ui-lab-page-and-demo-cards
    expect(code).toHaveClass("font-mono");
  });
});