import { render, screen } from "@testing-library/react";
import CollectionRelationshipsView from "@/components/identity/CollectionRelationshipsView";
import { TagMetadataProvider } from "@/components/tags/TagLink";
import type { CollectionRelationshipData } from "@/lib/collection-relationship-data";
const identity = (id: number, slug: string) => ({
  id,
  slug,
  displayName: slug,
  href: null,
  meta: {},
  metadata: { kind: "person" as const, contexts: {} },
});
const data: CollectionRelationshipData = {
  available: true,
  entries: [
    {
      motivation: {
        id: "1",
        subject: identity(6, "king-james"),
        person: identity(1, "lulu"),
        reasons: [
          {
            code: "favorite_player",
            explanation: "He was her favorite player.",
          },
        ],
        meta: {},
      },
      counts: [{ label: "Cards", cardCount: 400, rankingAt: "2026-11-15" }],
    },
  ],
  aliases: [],
};
test("Fam section shows historical reasons, canonical links and dated individual counts", () => {
  render(
    <TagMetadataProvider
      metadata={{
        "king-james": {
          href: "/cardattack/homies/king-james",
          hrefKind: "homie",
          isClickable: true,
        },
      }}
    >
      <CollectionRelationshipsView
        displayName="Lulu"
        mode="person"
        data={data}
      />
    </TagMetadataProvider>,
  );
  expect(
    screen.getByRole("heading", { name: "Collections inspired by Lulu" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "king-james" })).toHaveAttribute(
    "href",
    "/cardattack/homies/king-james",
  );
  expect(screen.getByText("He was her favorite player.")).toBeInTheDocument();
  expect(screen.getByText(/400 cards as of/)).toBeInTheDocument();
  expect(document.querySelector("time")).toHaveAttribute(
    "datetime",
    "2026-11-15",
  );
  expect(screen.queryByText(/total/i)).not.toBeInTheDocument();
});
test("subject section points to the inspiring person, preserving disabled links and alternate labels", () => {
  render(
    <TagMetadataProvider
      metadata={{ lulu: { href: null, hrefKind: "none", isClickable: false } }}
    >
      <CollectionRelationshipsView
        displayName="LeBron"
        mode="subject"
        data={{
          ...data,
          aliases: [
            { ...identity(392, "lebron-james"), displayName: "LeBron James" },
          ],
        }}
      />
    </TagMetadataProvider>,
  );
  expect(
    screen.getByRole("heading", { name: "Why I collect this" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "lulu" })).not.toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Alternate names" }),
  ).toBeInTheDocument();
  expect(screen.getByText("LeBron James")).toBeInTheDocument();
  expect(screen.queryByText(/400 cards/)).not.toBeInTheDocument();
});
test("missing counts are explicit and multiple sports never become a summed total", () => {
  const entry = data.entries[0];
  render(
    <CollectionRelationshipsView
      displayName="Lulu"
      mode="person"
      data={{
        available: true,
        aliases: [],
        entries: [
          { ...entry, counts: [] },
          {
            ...entry,
            motivation: { ...entry.motivation, id: "2" },
            counts: [
              { label: "Basketball", cardCount: 100, rankingAt: "2026-11-15" },
              { label: "Baseball", cardCount: 200, rankingAt: "2026-11-14" },
            ],
          },
        ],
      }}
    />,
  );
  expect(screen.getByText("Card count unavailable.")).toBeInTheDocument();
  expect(screen.queryByText(/300 cards/)).not.toBeInTheDocument();
  expect(document.querySelectorAll("time")).toHaveLength(2);
});
test.each([true, false])(
  "empty and unavailable sections have different honest states (%s)",
  (available) => {
    render(
      <CollectionRelationshipsView
        displayName="Lulu"
        mode="person"
        data={{ available, entries: [], aliases: [] }}
      />,
    );
    expect(
      screen.getByText(
        available
          ? "No inspired collections are recorded yet."
          : "Collection relationships are unavailable right now.",
      ),
    ).toBeInTheDocument();
  },
);
