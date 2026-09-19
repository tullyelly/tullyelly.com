import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NavigationSearch from "@/components/navigation/NavigationSearch";

const routerPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("NavigationSearch", () => {
  beforeEach(() => routerPush.mockReset());

  it("keeps local suggestions and submits broader encoded searches", async () => {
    const onSubmitted = jest.fn();
    const { rerender } = render(
      <NavigationSearch
        autoFocus={false}
        onSubmitted={onSubmitted}
        placeholder="Search tullyelly..."
      />,
    );

    const input = screen.getByPlaceholderText("Search tullyelly...");
    fireEvent.change(input, { target: { value: "Recent cards" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/search?q=Recent%20cards");
      expect(onSubmitted).toHaveBeenCalled();
    });

    rerender(
      <NavigationSearch
        autoFocus={false}
        onSubmitted={onSubmitted}
        suggestions={[
          { id: "scrolls", title: "Shaolin Scrolls", href: "/scrolls" },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Shaolin Scrolls/i }));

    expect(routerPush).toHaveBeenLastCalledWith("/scrolls");
  });

  it("preserves Escape cancellation when the drawer search stays open", () => {
    const onCancel = jest.fn();
    render(
      <NavigationSearch
        autoFocus={false}
        onCancel={onCancel}
        placeholder="Search tullyelly..."
      />,
    );

    fireEvent.keyDown(screen.getByPlaceholderText("Search tullyelly..."), {
      key: "Escape",
    });

    expect(onCancel).toHaveBeenCalled();
  });
});
