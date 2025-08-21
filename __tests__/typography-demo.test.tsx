import { render, screen } from "@testing-library/react";
import TypographyDemo from "@/app/typography-demo/page";
import "@testing-library/jest-dom";

describe("Typography Demo page", () => {
  it("renders heading hierarchy and code sample", () => {
    render(<TypographyDemo />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Typography");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Heading 2");
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Heading 3");
    const code = screen.getByText(/JetBrains Mono/, { selector: "code" });
    expect(code.tagName).toBe("CODE");
  });
});
