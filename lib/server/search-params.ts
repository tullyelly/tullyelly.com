import 'server-only';

export interface ParsedSearchParams {
  limit: number;
  offset: number;
  sort: string;
  q?: string;
}

type SearchParamRecord = Record<string, string | string[] | undefined>;

type SearchParamsPromise = Promise<SearchParamRecord | undefined> | undefined;

function first(val?: string | string[]) {
  return Array.isArray(val) ? val[0] : val;
}

export async function readSearchParams(
  searchParams: SearchParamsPromise,
): Promise<ParsedSearchParams> {
  const params: SearchParamRecord = (await searchParams) ?? {};

  const limitRaw = first(params.limit);
  const limitNum = Number.parseInt(limitRaw ?? '', 10);
  const limit = Math.min(Math.max(Number.isNaN(limitNum) ? 20 : limitNum, 1), 100);

  const offsetRaw = first(params.offset);
  const offsetNum = Number.parseInt(offsetRaw ?? '', 10);
  const offset = Math.max(Number.isNaN(offsetNum) ? 0 : offsetNum, 0);

  const sortRaw = first(params.sort);
  const sort = typeof sortRaw === 'string' && sortRaw ? sortRaw : 'semver:desc';

  const qRaw = first(params.q);
  const q = typeof qRaw === 'string' && qRaw ? qRaw : undefined;

  return { limit, offset, sort, q };
}
