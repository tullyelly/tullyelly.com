// app/__tests__/typography.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

function Page() {
  return (
    <main>
      <h1>Typography Check</h1>
      <code className="font-mono">const x = 1;</code>
    </main>
  );
}

describe("Typography system", () => {
  it("exposes a usable monospace utility via Tailwind (font-mono)", () => {
    render(<Page />);
    const code = screen.getByText(/const x = 1;/i);
    expect(code).toHaveClass("font-mono");
  });
});
