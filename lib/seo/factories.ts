import type { Metadata } from "next";
import { canonicalFor } from "./url";
import { buildMetadata } from "./builders";

type ListMetaOpts = {
  path: string; // e.g., "/mark2/shaolin-scrolls"
  getTitle: (q?: string, page?: string) => string;
  getDescription: (q?: string, page?: string) => string;
};

export function makeListGenerateMetadata({
  path,
  getTitle,
  getDescription,
}: ListMetaOpts) {
  return async function generateMetadata({
    searchParams,
  }: {
    searchParams: Promise<{ q?: string; page?: string }>;
  }): Promise<Metadata> {
    const params = (await searchParams) ?? {};
    const q = params.q?.trim() || "";
    const page = params.page || "";
    const title = getTitle(q, page);
    const description = getDescription(q, page);
    const canonical = canonicalFor(
      path,
      q ? `?q=${encodeURIComponent(q)}` : undefined,
    );
    return buildMetadata({
      title,
      description,
      canonical,
      type: "website",
      twitterCard: "summary",
    });
  };
}

type DetailMetaOpts<T> = {
  pathBase: string; // e.g., "/mark2/shaolin-scrolls"
  fetcher: (id: string) => Promise<T | null>;
  resolve: (entity: T) => {
    title: string;
    description: string;
    canonicalPath: string; // include /:id
    index?: boolean;
  };
};

export function makeDetailGenerateMetadata<T>({
  pathBase,
  fetcher,
  resolve,
}: DetailMetaOpts<T>) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ id: string }>;
  }): Promise<Metadata> {
    const { id } = await params;
    const entity = await fetcher(id);
    if (!entity) {
      return buildMetadata({
        title: "Not found",
        description: "The requested resource could not be located.",
        canonical: canonicalFor(`${pathBase}/${id}`),
        robots: { index: false, follow: false },
      });
    }
    const out = resolve(entity);
    return buildMetadata({
      title: out.title,
      description: out.description,
      canonical: canonicalFor(out.canonicalPath),
      robots: { index: out.index ?? true, follow: out.index ?? true },
      type: "website",
      twitterCard: "summary",
    });
  };
}
