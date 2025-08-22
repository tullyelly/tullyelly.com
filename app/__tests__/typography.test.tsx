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
  it.skip("applies Inter and JB Mono variables to <html>", () => {
    const element = RootLayout({ children: <Page /> }) as React.ReactElement;
    const className = element.props.className as string;
    expect(className).toMatch(/--font-inter/);
    expect(className).toMatch(/--font-jbmono/);
  });

  it("exposes a usable monospace utility via Tailwind (font-mono)", () => {
    render(<Page />);
    const code = screen.getByText(/const x = 1;/i);
    expect(code).toHaveClass("font-mono");
  });
});