import { isSameRoute } from "@/components/nav/sameRoute";

describe("isSameRoute", () => {
  it("ignores trailing slashes", () => {
    expect(isSameRoute("/foo/", "/foo")).toBe(true);
  });

  it("respects query strings", () => {
    expect(isSameRoute("/?persona=mark2", "/?persona=mark2")).toBe(true);
    expect(isSameRoute("/?persona=mark2", "/?persona=shaolin")).toBe(false);
  });

  it("treats reordered query params as equal", () => {
    expect(isSameRoute("/foo?a=1&b=2", "/foo?b=2&a=1")).toBe(true);
  });

  it("handles relative hrefs", () => {
    expect(isSameRoute("/foo", "foo")).toBe(true);
  });
});
