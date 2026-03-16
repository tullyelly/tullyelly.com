import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TagCommentsSection } from "@/components/chronicles/TagCommentsSection";

function makeComment(id: number, createdAt: string) {
  return {
    id: String(id),
    body: `comment ${id}`,
    created_at: createdAt,
    user_name: `identity ${id}`,
  };
}

describe("TagCommentsSection", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders nothing when no comments exist", async () => {
    global.fetch = jest.fn(async () =>
      Response.json([], { status: 200 }),
    ) as typeof fetch;

    render(<TagCommentsSection tag="cipher" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tag-comments?tag=cipher&limit=10",
      );
    });

    expect(screen.queryByText("Community")).not.toBeInTheDocument();
    expect(
      screen.queryByText("No comments from this identity yet."),
    ).not.toBeInTheDocument();
  });

  it("loads more comments using the last timestamp as the cursor", async () => {
    const firstPage = Array.from({ length: 10 }, (_, index) =>
      makeComment(index + 1, `2026-03-14T10:${String(index).padStart(2, "0")}:00.000Z`),
    );
    const secondPage = [makeComment(11, "2026-03-14T09:00:00.000Z")];

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(Response.json(firstPage, { status: 200 }))
      .mockResolvedValueOnce(Response.json(secondPage, { status: 200 })) as typeof fetch;

    render(<TagCommentsSection tag="cipher" />);

    expect(await screen.findByText("comment 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("comment 11")).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        "/api/tag-comments?tag=cipher&limit=10&cursor=2026-03-14T10%3A09%3A00.000Z",
      );
    });
  });
});
