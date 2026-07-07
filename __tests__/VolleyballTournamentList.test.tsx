import { render, screen, within } from "@testing-library/react";

jest.mock("@/lib/datetime", () => ({
  fmtDate: (value: string) => value,
}));

import VolleyballTournamentList from "@/components/unclejimmy/VolleyballTournamentList";

describe("VolleyballTournamentList", () => {
  it("renders the standardized finish column with tournament rows", () => {
    render(
      <VolleyballTournamentList
        rows={[
          {
            tournamentId: "8",
            tournamentName: "AAU Nationals",
            finish: 4,
            overallWins: 5,
            overallLosses: 3,
            overallRecord: "5-3",
            tournamentDays: 4,
            latestTournamentDate: "2026-07-07",
          },
          {
            tournamentId: "7",
            tournamentName: "Summer Tune Up",
            finish: null,
            overallWins: 1,
            overallLosses: 2,
            overallRecord: "1-2",
            tournamentDays: 2,
            latestTournamentDate: "2026-06-21",
          },
        ]}
      />,
    );

    const table = screen.getByTestId("volleyball-tournament-table");
    const finishHeader = within(table).getByRole("columnheader", {
      name: "Finish",
    });
    expect(finishHeader).toBeInTheDocument();
    expect(within(table).getByText("4th Place")).toBeInTheDocument();
    expect(within(table).getByText("Not tracked")).toBeInTheDocument();
  });
});
