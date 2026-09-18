import { render, screen } from "@testing-library/react";

const mockSearchSite = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("@/lib/search/site-search", () => ({
  searchSite: (...args: unknown[]) => mockSearchSite(...args),
}));

import SearchPage from "@/app/search/page";

describe("Search page", () => {
  it("renders Page and Chronicle result types", async () => {
    mockSearchSite.mockResolvedValue([
      {
        type: "page",
        title: "Clans",
        href: "/cardattack/clans",
        description: "CardAttack",
        keywords: [],
        score: 100,
      },
      {
        type: "chronicle",
        title: "Collecting Stories",
        href: "/shaolin/collecting-stories",
        description: "Notes from collecting.",
        keywords: ["cards"],
        score: 70,
      },
    ]);

    render(
      await SearchPage({
        searchParams: Promise.resolve({ q: "collect" }),
      }),
    );

    expect(screen.getByText("Clans")).toBeInTheDocument();
    expect(screen.getByText("Collecting Stories")).toBeInTheDocument();
    expect(screen.getByText("Page")).toBeInTheDocument();
    expect(screen.getByText("Chronicle")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clear search" })).toHaveClass(
      "!text-white",
      "!no-underline",
    );
    expect(mockSearchSite).toHaveBeenCalledWith("collect");
  });
});
