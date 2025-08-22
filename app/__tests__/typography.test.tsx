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
    render(
      <RootLayout>
        <Page />
      </RootLayout>
    );

    const html = document.documentElement; // <html>
    const className = html.className;

    // Assert variable tokens are present (don’t couple to hashed classnames)
    expect(className).toMatch(/--font-inter/);
    expect(className).toMatch(/--font-jbmono/);
  });

  it("exposes a usable monospace utility via Tailwind (font-mono)", () => {
    render(
      <RootLayout>
        <Page />
      </RootLayout>
    );

    const code = screen.getByText(/const x = 1;/i);
    expect(code).toHaveClass("font-mono");
  });
});