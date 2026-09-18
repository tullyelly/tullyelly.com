import { buildChronicleMetadata } from "@/lib/seo/chronicle-metadata";
import {
  SHARED_OPEN_GRAPH_FIELDS,
  SHARED_TWITTER_FIELDS,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/seo/constants";
import { buildMetadata } from "@/lib/seo/builders";
import { buildRootMetadata } from "@/lib/seo/root-metadata";

describe("shared social preview metadata", () => {
  it("uses the branded image and large Twitter card on the homepage", () => {
    const metadata = buildRootMetadata();

    expect(metadata.title).toBe(SITE_TITLE);
    expect(metadata.description).toBe(SITE_DESCRIPTION);
    expect(metadata.openGraph?.images).toEqual(SHARED_OPEN_GRAPH_FIELDS.images);
    expect(metadata.twitter).toMatchObject(SHARED_TWITTER_FIELDS);
    expect(metadata.metadataBase).toEqual(new URL(SITE_URL));
  });

  it("retains the fallback image for a normal route override", () => {
    const metadata = buildMetadata({
      title: "Cardattack vault",
      description: "A menu-driven route.",
      canonical: "https://tullyelly.com/cardattack",
    });

    expect(metadata.alternates?.canonical).toBe(
      "https://tullyelly.com/cardattack",
    );
    expect(metadata.openGraph).toMatchObject({
      title: "Cardattack vault",
      images: SHARED_OPEN_GRAPH_FIELDS.images,
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: SHARED_TWITTER_FIELDS.images,
    });
  });

  it("keeps Chronicle title, summary, and canonical with the fallback image", () => {
    const metadata = buildChronicleMetadata({
      title: "A Chronicle",
      summary: "Its own summary.",
      canonical: "https://example.com/original",
    });

    expect(metadata).toMatchObject({
      title: "A Chronicle",
      description: "Its own summary.",
      alternates: { canonical: "https://example.com/original" },
      openGraph: {
        title: "A Chronicle",
        description: "Its own summary.",
        images: SHARED_OPEN_GRAPH_FIELDS.images,
      },
      twitter: {
        card: "summary_large_image",
        title: "A Chronicle",
        description: "Its own summary.",
        images: SHARED_TWITTER_FIELDS.images,
      },
    });
  });
});
