import { render, waitFor } from "@testing-library/react";
import RecentlyViewedTracker from "@/components/app-shell/RecentlyViewedTracker";
import { readRecent } from "@/lib/menu.recents";

jest.mock("next/navigation", () => ({
  usePathname: () => "/cardattack/clans/wu-tang",
}));

describe("RecentlyViewedTracker", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.title = "Wu-Tang Clan; tullyelly";
  });

  it("records a successfully rendered non-menu route", async () => {
    render(<RecentlyViewedTracker menuItems={[]} />);

    await waitFor(() => {
      expect(readRecent()).toEqual([
        {
          href: "/cardattack/clans/wu-tang",
          title: "Wu-Tang Clan",
        },
      ]);
    });
  });

  it("does not record an excluded page state", async () => {
    document.body.setAttribute("data-recent-history-exclude", "");
    render(<RecentlyViewedTracker menuItems={[]} />);

    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    expect(readRecent()).toEqual([]);
    document.body.removeAttribute("data-recent-history-exclude");
  });
});
