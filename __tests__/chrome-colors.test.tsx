import { render } from "@testing-library/react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";

test("header and footer share the same background", () => {
  document.documentElement.style.setProperty("--brand-chrome", "#0077C0");
  document.documentElement.style.setProperty("--brand-chrome-fg", "#ffffff");

  const { container: h } = render(<SiteHeader />);
  const headerEl = h.querySelector("header")!;
  const { container: f } = render(<Footer />);
  const footerEl = f.querySelector("footer")!;
  const hBg = getComputedStyle(headerEl).backgroundColor;
  const fBg = getComputedStyle(footerEl).backgroundColor;
  expect(hBg).toBe(fBg);
});
