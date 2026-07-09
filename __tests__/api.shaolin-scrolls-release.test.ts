/** @jest-environment node */

import { POST as postMinor } from "@/app/api/shaolin-scrolls/minor/route";
import { POST as postPatch } from "@/app/api/shaolin-scrolls/patch/route";
import {
  AuthzForbiddenError,
  AuthzUnauthenticatedError,
} from "@/lib/authz/types";

const mockQuery = jest.fn();
const mockGetPool = jest.fn();
const mockRequireScrollsReleaseCreate = jest.fn<
  Promise<boolean | void>,
  []
>();

jest.mock("@/db/pool", () => ({
  getPool: (...args: unknown[]) => mockGetPool(...args),
}));

jest.mock("@/lib/auth/permissions", () => ({
  requireScrollsReleaseCreate: () => mockRequireScrollsReleaseCreate(),
}));

type ReleasePost = (req: Request) => Promise<Response>;

type ReleaseEndpointCase = {
  name: string;
  path: string;
  post: ReleasePost;
  sql: string;
  rowName: string;
};

const endpoints: ReleaseEndpointCase[] = [
  {
    name: "patch",
    path: "/api/shaolin-scrolls/patch",
    post: postPatch,
    sql: "SELECT * FROM dojo.fn_next_patch($1::text);",
    rowName: "shaolin 1.0.1 hotfix: Patch label",
  },
  {
    name: "minor",
    path: "/api/shaolin-scrolls/minor",
    post: postMinor,
    sql: "SELECT * FROM dojo.fn_next_minor($1::text);",
    rowName: "shaolin 1.1.0 Minor label",
  },
];

function makeRequest(path: string, body: unknown) {
  return new Request(`http://example.local${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/shaolin-scrolls release mutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPool.mockReset();
    mockQuery.mockReset();
    mockRequireScrollsReleaseCreate.mockReset();

    mockGetPool.mockReturnValue({ query: mockQuery });
    mockRequireScrollsReleaseCreate.mockResolvedValue(undefined);
  });

  it.each(endpoints)(
    "returns 400 for invalid $name labels before authz",
    async ({ path, post }) => {
      const res = await post(makeRequest(path, { label: "" }));

      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: "invalid label" });
      expect(mockRequireScrollsReleaseCreate).not.toHaveBeenCalled();
      expect(mockQuery).not.toHaveBeenCalled();
    },
  );

  it.each(endpoints)(
    "returns 401 for unauthenticated $name creates",
    async ({ path, post }) => {
      mockRequireScrollsReleaseCreate.mockRejectedValueOnce(
        new AuthzUnauthenticatedError(),
      );

      const res = await post(makeRequest(path, { label: "Release label" }));

      expect(res.status).toBe(401);
      await expect(res.json()).resolves.toEqual({ error: "UNAUTHENTICATED" });
      expect(mockQuery).not.toHaveBeenCalled();
    },
  );

  it.each(endpoints)(
    "returns 403 for forbidden $name creates",
    async ({ path, post }) => {
      mockRequireScrollsReleaseCreate.mockRejectedValueOnce(
        new AuthzForbiddenError(),
      );

      const res = await post(makeRequest(path, { label: "Release label" }));

      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ error: "FORBIDDEN" });
      expect(mockQuery).not.toHaveBeenCalled();
    },
  );

  it.each(endpoints)(
    "returns 403 when $name authz resolves false",
    async ({ path, post }) => {
      mockRequireScrollsReleaseCreate.mockResolvedValueOnce(false);

      const res = await post(makeRequest(path, { label: "Release label" }));

      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ error: "FORBIDDEN" });
      expect(mockQuery).not.toHaveBeenCalled();
    },
  );

  it.each(endpoints)(
    "creates authorized $name releases",
    async ({ path, post, sql, rowName }) => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ scroll_id: 123, generated_name: rowName }],
      });

      const res = await post(makeRequest(path, { label: "  Release label  " }));

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({
        id: "123",
        generated_name: rowName,
      });
      expect(mockRequireScrollsReleaseCreate).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(sql, ["Release label"]);
    },
  );
});
