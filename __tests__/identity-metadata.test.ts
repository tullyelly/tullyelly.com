jest.mock("server-only", () => ({}));
jest.mock("@/lib/identity-server", () => ({ getIdentityBySlug: jest.fn() }));
import { getIdentityBySlug } from "@/lib/identity-server";
import { makeIdentityGenerateMetadata } from "@/lib/seo/identity-metadata";
const readIdentity = jest.mocked(getIdentityBySlug);
beforeEach(() => readIdentity.mockReset());
it("uses canonical identities and authored names without browse parameters", async () => {
  readIdentity.mockResolvedValue({
    slug: "canonical",
    displayName: "Authored Artist",
    metadata: { kind: "person" },
  } as Awaited<ReturnType<typeof getIdentityBySlug>>);
  const generate = makeIdentityGenerateMetadata({
    directory: "/theabbott/homies",
    kind: "person",
    noun: "Homie",
  });
  const metadata = await generate({
    params: Promise.resolve({ slug: "alias" }),
  });
  expect(metadata.title).toContain("Authored Artist");
  expect(metadata.alternates?.canonical).toBe(
    "https://tullyelly.com/theabbott/homies/canonical",
  );
});
it("preserves authored family previews without needing an identity lookup", async () => {
  const generate = makeIdentityGenerateMetadata({
    directory: "/unclejimmy/fam",
    kind: "person",
    noun: "Fam",
    authored: {
      bonnibel: {
        title: "Bonnibel's story",
        openGraph: { images: ["/family.webp"] },
      },
    },
  });
  const metadata = await generate({
    params: Promise.resolve({ slug: "bonnibel" }),
  });
  expect(metadata.title).toBe("Bonnibel's story");
  expect(metadata.openGraph?.images).toEqual(["/family.webp"]);
  expect(metadata.alternates?.canonical).toBe(
    "https://tullyelly.com/unclejimmy/fam/bonnibel",
  );
  expect(readIdentity).not.toHaveBeenCalled();
});
it("does not index unknown identities, including object prototype names", async () => {
  readIdentity.mockResolvedValue(null);
  const generate = makeIdentityGenerateMetadata({
    directory: "/unclejimmy/fam",
    kind: "person",
    noun: "Fam",
  });
  expect(
    (await generate({ params: Promise.resolve({ slug: "constructor" }) }))
      .robots,
  ).toEqual({ index: false, follow: true });
});
