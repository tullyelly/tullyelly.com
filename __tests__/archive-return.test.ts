import { getArchiveReturnDirectory } from "@/lib/archive-return";
import {
  safeDirectoryReturn,
  withDirectoryReturn,
} from "@/lib/directory-state";
import { getPersonaReleaseLogHref } from "@/lib/persona-release-feeds";

it.each([
  "https://evil.test/shaolin",
  "//evil.test/shaolin",
  "/shaolin/../admin",
  "/shaolin/tags/../../admin",
  "/unknown/releases",
  "/shaolin/tags/tag/extra",
])("rejects unrecognized archive source %s", (source) => {
  expect(getArchiveReturnDirectory(source)).toBeNull();
});
it("restores only public release controls and retains the source section anchor", () => {
  const source = getPersonaReleaseLogHref("mark2", 2, "oldest", "release text");
  expect(getArchiveReturnDirectory(source)?.path).toBe("/mark2/releases");
  expect(
    safeDirectoryReturn(source + "&token=private", "/mark2/releases"),
  ).toBe("/mark2/releases?q=release+text&page=2&order=oldest");
  expect(withDirectoryReturn("/shaolin/post#release-section-2", source)).toBe(
    `/shaolin/post?returnTo=${encodeURIComponent(source)}#release-section-2`,
  );
});

it("accepts the existing encoded tag archive slugs", () => {
  expect(getArchiveReturnDirectory("/shaolin/tags/a%2Fb-%26-c")?.path).toBe(
    "/shaolin/tags/a%2Fb-%26-c",
  );
});
