import {
  clampDirectoryPage,
  readDirectoryValue,
  safeDirectoryReturn,
  updateDirectoryQuery,
  withDirectoryReturn,
} from "@/lib/directory-state";

describe("directory query contracts", () => {
  it("rejects malformed and unsupported paging/sorts", () => {
    for (const page of [
      "0",
      "-1",
      "1.5",
      "1x",
      "Infinity",
      "9007199254740992",
    ]) {
      expect(readDirectoryValue(new URLSearchParams({ page }), "page", 1)).toBe(
        1,
      );
    }
    expect(readDirectoryValue(new URLSearchParams("page=3"), "page", 1)).toBe(
      3,
    );
    expect(
      readDirectoryValue(new URLSearchParams("sort=private"), "sort", "name", [
        "name",
        "rank",
      ]),
    ).toBe("name");
    expect(readDirectoryValue(new URLSearchParams(), "q", "")).toBe("");
    expect(
      readDirectoryValue(
        new URLSearchParams("pageSize=7"),
        "pageSize",
        25,
        [25, 50],
      ),
    ).toBe(25);
  });
  it("resets pagination while preserving unrelated state", () => {
    expect(
      updateDirectoryQuery("page=9&sport=basketball&view=grid", "q", "Cal", ""),
    ).toBe("sport=basketball&view=grid&q=Cal");
    expect(updateDirectoryQuery("q=Cal&sort=name&page=2", "q", "", "")).toBe(
      "sort=name",
    );
    expect(updateDirectoryQuery("q=Cal", "page", 2, 1)).toBe("q=Cal&page=2");
    expect(clampDirectoryPage(9, 26, 25)).toBe(2);
    expect(clampDirectoryPage(9, 0, 25)).toBe(1);
  });
  it("allows only the expected directory and public browse keys", () => {
    const directory = "/cardattack/homies";
    for (const candidate of [
      undefined,
      "https://evil.test",
      "//evil.test",
      "/cardattack/homies?q=%ZZ",
      "/cardattack/homies?q=%FF",
      "/\\evil.test",
      "/cardattack/clans",
      "/cardattack/homies#bad",
      "/cardattack/homies\n",
      "/cardattack/%68omies",
    ]) {
      expect(safeDirectoryReturn(candidate, directory)).toBe(directory);
    }
    expect(
      safeDirectoryReturn(
        `${directory}?q=Cal&page=2&draft=secret&returnTo=evil`,
        directory,
      ),
    ).toBe(`${directory}?q=Cal&page=2`);
    expect(
      safeDirectoryReturn(`${directory}?q=Cal&sort=name`, directory, ["q"]),
    ).toBe(`${directory}?q=Cal`);
    expect(
      withDirectoryReturn("/cardattack/homies/cal", `${directory}?q=Cal`),
    ).toBe("/cardattack/homies/cal?returnTo=%2Fcardattack%2Fhomies%3Fq%3DCal");
    expect(withDirectoryReturn("https://example.com", directory)).toBe(
      "https://example.com",
    );
  });
});
