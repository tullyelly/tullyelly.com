const mockSql = jest.fn();

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

import {
  getIdentityBySlug,
  getIdentityHref,
  listGroupMembers,
  listIdentityGroups,
  listIncomingIdentityRelations,
  listOutgoingIdentityRelations,
} from "@/lib/identity-server";

const relationRow = {
  id: "9",
  relation_type: "member_of",
  meta: { since: 1992 },
  source_id: 1,
  source_slug: "rza",
  source_name: "RZA",
  source_display_name: null,
  source_href: "/shaolin/tags/rza",
  source_meta: { identity: { kind: "person" } },
  target_id: 2,
  target_slug: "wu-tang-clan",
  target_name: "Wu-Tang Clan",
  target_display_name: "Wu-Tang Clan",
  target_href: "/shaolin/tags/wu-tang-clan",
  target_meta: { identity: { kind: "group" } },
};

describe("identity server helpers", () => {
  beforeEach(() => mockSql.mockReset());

  test("resolves an identity and its context-aware route", async () => {
    mockSql.mockResolvedValue([
      {
        id: 1,
        slug: "rza",
        name: "rza",
        display_name: "RZA",
        href: "/shaolin/tags/rza",
        meta: {
          untouched: true,
          identity: {
            kind: "person",
            contexts: {
              cardattack: { role: "homie", href: "/cardattack/homies/rza" },
            },
          },
        },
      },
    ]);

    const identity = await getIdentityBySlug("RZA");

    expect(identity?.metadata.kind).toBe("person");
    expect(identity?.meta.untouched).toBe(true);
    expect(identity && getIdentityHref(identity, "cardattack")).toBe(
      "/cardattack/homies/rza",
    );
    expect(mockSql.mock.calls[0]?.[1]).toEqual(["rza"]);
  });

  test("keeps outgoing and incoming relationship direction distinct", async () => {
    mockSql.mockResolvedValue([relationRow]);

    const outgoing = await listOutgoingIdentityRelations("rza", "member_of");
    const incoming = await listIncomingIdentityRelations(
      "wu-tang-clan",
      "member_of",
    );

    expect(outgoing[0]?.source.slug).toBe("rza");
    expect(outgoing[0]?.target.slug).toBe("wu-tang-clan");
    expect(incoming[0]?.source.slug).toBe("rza");
    const outgoingSql = (mockSql.mock.calls[0]?.[0] as string[]).join("?");
    const incomingSql = (mockSql.mock.calls[1]?.[0] as string[]).join("?");
    expect(outgoingSql).toContain("WHERE source.slug =");
    expect(incomingSql).toContain("WHERE target.slug =");
  });

  test("lists groups and members through member_of", async () => {
    mockSql.mockResolvedValue([relationRow]);

    await expect(listIdentityGroups("rza")).resolves.toMatchObject([
      { slug: "wu-tang-clan" },
    ]);
    await expect(listGroupMembers("wu-tang-clan")).resolves.toMatchObject([
      { slug: "rza" },
    ]);
    expect(mockSql.mock.calls[0]?.[1]).toEqual([
      "rza",
      "member_of",
      "member_of",
    ]);
    expect(mockSql.mock.calls[1]?.[1]).toEqual([
      "wu-tang-clan",
      "member_of",
      "member_of",
    ]);
  });
});
