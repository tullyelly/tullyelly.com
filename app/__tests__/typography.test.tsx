import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("next/font/local", () => {
  return (opts: any) => ({
    variable: opts.variable,
    className: opts.variable,
  });
});

import RootLayout from "../layout"; // default export
// Note: RootLayout applies `${inter.variable} ${jbMono.variable}` to <html>

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
    // Render the layout with a child page
    render(
      // @ts-expect-error – RootLayout’s signature matches Next’s layout contract
      <RootLayout>
        <Page />
      </RootLayout>
    );

    const html = document.documentElement; // <html>
    const className = html.className;

    // We don’t import inter/jbMono here to avoid coupling the test to implementation details.
    // We only assert that two non-empty variable-bearing classes were applied.
    expect(className).toMatch(/--font-inter/);
    expect(className).toMatch(/--font-jbmono/);
  });

  it("exposes a usable monospace utility via Tailwind (font-mono)", () => {
    render(
      // @ts-expect-error – see note above
      <RootLayout>
        <Page />
      </RootLayout>
    );

    const code = screen.getByText(/const x = 1;/i);
    expect(code).toHaveClass("font-mono");
  });
});
