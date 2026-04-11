import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const compileMdxToCodeMock = jest.fn();
const chronicleSectionMdxRendererMock = jest.fn(
  ({
    code,
  }: {
    code: string;
    postDate: string;
    components?: Record<string, unknown>;
  }) => <div data-testid="chronicle-section-mdx-renderer">{code}</div>,
);

jest.mock("@/lib/mdx/compile", () => ({
  compileMdxToCode: (...args: unknown[]) => compileMdxToCodeMock(...args),
}));
jest.mock("@/components/chronicles/ChronicleSectionMdxRenderer", () => ({
  ChronicleSectionMdxRenderer: (props: {
    code: string;
    postDate: string;
    components?: Record<string, unknown>;
  }) => chronicleSectionMdxRendererMock(props),
}));
jest.mock("@/lib/datetime", () => ({
  fmtDate: (value: string) => value,
}));
jest.mock("@/components/mdx/ReleaseSection", () => ({
  __esModule: true,
  default: ({ children }: { children?: ReactNode }) => (
    <div data-testid="release-section">{children}</div>
  ),
}));

import VolleyballTournamentSections from "@/components/unclejimmy/VolleyballTournamentSections";

describe("VolleyballTournamentSections", () => {
  beforeEach(() => {
    compileMdxToCodeMock.mockReset();
    chronicleSectionMdxRendererMock.mockClear();
    compileMdxToCodeMock.mockImplementation(async (source: string) => {
      return `compiled:${source}`;
    });
  });

  it("passes each tournament section date into the shared chronicle section renderer", async () => {
    const sections = [
      {
        tournamentId: "401",
        postSlug: "tournament-day-one",
        postUrl: "/shaolin/tournament-day-one",
        postDate: "2026-04-01",
        postTitle: "tournament day one",
        tournamentName: "Spring Classic",
        tournamentRecord: "3-1",
        mdx: "<ReleaseSection tournamentId={401} divider={true}>Day one</ReleaseSection>",
      },
      {
        tournamentId: "401",
        postSlug: "tournament-day-two",
        postUrl: "/shaolin/tournament-day-two",
        postDate: "2026-04-02",
        postTitle: "tournament day two",
        tournamentName: "Spring Classic",
        tournamentRecord: "5-1",
        mdx: "<ReleaseSection tournamentId={401}>Day two</ReleaseSection>",
      },
    ];

    const ui = await VolleyballTournamentSections({ sections });
    render(ui);

    expect(compileMdxToCodeMock).toHaveBeenCalledTimes(2);
    const firstCompiledSource = String(
      compileMdxToCodeMock.mock.calls[0]?.[0] ?? "",
    );
    expect(firstCompiledSource).toContain("divider={false}");
    expect(chronicleSectionMdxRendererMock).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole("link", { name: "Jump to 2026-04-01 (Day 1)" }),
    ).toHaveAttribute("href", "#section-tournament-day-one-1");

    const firstRendererProps = chronicleSectionMdxRendererMock.mock
      .calls[0]?.[0] as
      | {
          postDate?: string;
          components?: { ReleaseSection?: unknown };
        }
      | undefined;
    const secondRendererProps = chronicleSectionMdxRendererMock.mock
      .calls[1]?.[0] as
      | {
          postDate?: string;
          components?: { ReleaseSection?: unknown };
        }
      | undefined;

    expect(firstRendererProps?.postDate).toBe("2026-04-01");
    expect(firstRendererProps?.components?.ReleaseSection).toBeDefined();
    expect(secondRendererProps?.postDate).toBe("2026-04-02");
    expect(secondRendererProps?.components?.ReleaseSection).toBeDefined();
  });
});
