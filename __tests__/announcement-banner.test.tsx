import { render, screen, fireEvent } from "@testing-library/react";
import AnnouncementBanner from "@/components/AnnouncementBanner";

test("renders message as link when href provided", () => {
  render(<AnnouncementBanner message="hello" href="/about" />);
  const link = screen.getByRole("link", { name: /hello/i });
  expect(link).toHaveAttribute("href", "/about");
});

test("can be dismissed", () => {
  render(<AnnouncementBanner message="bye" dismissible />);
  fireEvent.click(screen.getByLabelText(/dismiss announcement/i));
  expect(screen.queryByText("bye")).toBeNull();
});
