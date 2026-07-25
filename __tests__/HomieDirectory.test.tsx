import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import HomieDirectory from "@/app/cardattack/homies/_components/HomieDirectory";
import type { HomieDirectoryRow } from "@/lib/data/homies";
import { getPersistentBanners } from "@/lib/persistent-banner";

const giannis: HomieDirectoryRow = {
  id: 34,
  name: "Giannis Antetokounmpo",
  tag_slug: "freak",
  drafted: 2013,
  updated_at: null,
  route_slug: "freak",
  card_count: 989,
  ranking: 1,
  ranking_at: "2026-07-25",
  difference: 1,
  rank_delta: 1,
  diff_delta: 1,
  trend_rank: "up",
  trend_overall: "up",
  diff_sign_changed: false,
};

describe("HomieDirectory desktop editing", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("toggles a focused editing table with room for the full name", () => {
    render(<HomieDirectory initialRows={[giannis]} canUpdate />);

    const table = screen.getByRole("table", {
      name: "Homie directory table",
    });
    expect(
      within(table).getByRole("columnheader", { name: "Cards" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Unlock Editing" }));

    expect(
      within(table).queryByRole("columnheader", { name: "Cards" }),
    ).not.toBeInTheDocument();
    expect(
      within(table).queryByRole("columnheader", { name: "Rank" }),
    ).not.toBeInTheDocument();
    expect(
      within(table).queryByRole("columnheader", { name: "Trend" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", {
        name: "Name for Giannis Antetokounmpo",
      }),
    ).toHaveValue("Giannis Antetokounmpo");
    expect(table).toHaveClass("table-fixed");

    fireEvent.click(screen.getByRole("button", { name: "Lock Editing" }));

    expect(
      within(table).getByRole("columnheader", { name: "Cards" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", {
        name: "Name for Giannis Antetokounmpo",
      }),
    ).not.toBeInTheDocument();
  });

  it("does not discard unsaved edits without confirmation", () => {
    const confirm = jest.spyOn(window, "confirm").mockReturnValue(false);
    render(<HomieDirectory initialRows={[giannis]} canUpdate />);

    fireEvent.click(screen.getByRole("button", { name: "Unlock Editing" }));
    fireEvent.change(
      screen.getByRole("textbox", {
        name: "Name for Giannis Antetokounmpo",
      }),
      { target: { value: "Giannis" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Lock Editing" }));

    expect(confirm).toHaveBeenCalledWith(
      "Discard all unsaved changes and lock editing?",
    );
    expect(
      screen.getByRole("textbox", {
        name: "Name for Giannis Antetokounmpo",
      }),
    ).toHaveValue("Giannis");

    confirm.mockRestore();
  });

  it("publishes successful saves to the persistent page queue", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: giannis.id,
          name: "Giannis",
          tag_slug: giannis.tag_slug,
          drafted: giannis.drafted,
          updated_at: "2026-07-25T12:00:00.000Z",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(<HomieDirectory initialRows={[giannis]} canUpdate />);

    fireEvent.click(screen.getByRole("button", { name: "Unlock Editing" }));
    fireEvent.change(
      screen.getByRole("textbox", {
        name: "Name for Giannis Antetokounmpo",
      }),
      { target: { value: "Giannis" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(getPersistentBanners()).toEqual([
        expect.objectContaining({
          message: "Giannis was saved.",
          variant: "success",
        }),
      ]),
    );
    fetchMock.mockRestore();
  });

  it("publishes failures while preserving the edited value", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "HOMIE_UPDATE_FAILED" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<HomieDirectory initialRows={[giannis]} canUpdate />);

    fireEvent.click(screen.getByRole("button", { name: "Unlock Editing" }));
    const nameInput = screen.getByRole("textbox", {
      name: "Name for Giannis Antetokounmpo",
    });
    fireEvent.change(nameInput, { target: { value: "Giannis" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(getPersistentBanners()).toEqual([
        expect.objectContaining({
          message: "The update failed. Try again.",
          variant: "error",
        }),
      ]),
    );
    expect(nameInput).toHaveValue("Giannis");
    fetchMock.mockRestore();
  });
});
