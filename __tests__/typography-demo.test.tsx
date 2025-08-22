import { render, screen } from "@testing-library/react";
import TypographyDemo from "@/app/typography-demo/page";
import "@testing-library/jest-dom";

describe("Typography Demo page", () => {
  it("renders heading hierarchy, meta, and code samples", () => {
    render(<TypographyDemo />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Typography");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Heading 2");
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Heading 3");
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("Heading 4");
    const meta = screen.getByText(/Updated/);
    expect(meta).toHaveClass("font-mono");
    const codeInline = screen.getByText(/JetBrains Mono/, { selector: "code" });
    expect(codeInline).toHaveClass("font-mono");
    const block = screen.getByText(/function hello/).closest("pre");
    expect(block).toHaveClass("font-mono");
  });
});
