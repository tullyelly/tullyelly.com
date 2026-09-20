import { readIdentityMetadata, resolveIdentityHref } from "@/lib/identity";

describe("identity metadata", () => {
  test("reads generic kind and alter-ego-specific contexts", () => {
    const meta = {
      retained: { source: "legacy" },
      identity: {
        kind: "person",
        contexts: {
          cardattack: { role: "homie", href: "/cardattack/homies/rza" },
          unclejimmy: { role: "fam", href: "/unclejimmy/squad/rza" },
        },
      },
    };

    expect(readIdentityMetadata(meta)).toEqual({
      kind: "person",
      contexts: {
        cardattack: { role: "homie", href: "/cardattack/homies/rza" },
        unclejimmy: { role: "fam", href: "/unclejimmy/squad/rza" },
      },
    });
    expect(meta.retained).toEqual({ source: "legacy" });
  });

  test("uses a context route before the legacy canonical href", () => {
    const meta = {
      identity: {
        kind: "group",
        contexts: {
          cardattack: {
            role: "clan",
            href: "/cardattack/clans/wu-tang-clan",
          },
          theabbott: { role: "clan", href: "/theabbott/clans/wu-tang-clan" },
        },
      },
    };

    expect(
      resolveIdentityHref(meta, "theabbott", "/shaolin/tags/wu-tang-clan"),
    ).toBe("/theabbott/clans/wu-tang-clan");
    expect(
      resolveIdentityHref(meta, "unclejimmy", "/shaolin/tags/wu-tang-clan"),
    ).toBe("/shaolin/tags/wu-tang-clan");
  });

  test("ignores malformed identity fields without rejecting unrelated metadata", () => {
    expect(
      readIdentityMetadata({
        identity: {
          kind: "album",
          contexts: { cardattack: { role: "artist", href: "  " } },
        },
        existing: true,
      }),
    ).toEqual({ contexts: { cardattack: {} } });
  });
});
