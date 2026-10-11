/** @jest-environment node */
import { spawnSync } from "node:child_process";
import { mkdtempSync, existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const fixtures = [
  "normal",
  "traversal",
  "absolute",
  "symlink",
  "hardlink",
  "device",
  "duplicate",
];
test.each(fixtures)(
  "archive extraction handles %s without escaping its sandbox",
  (kind) => {
    const root = mkdtempSync(join(tmpdir(), "maintenance-archive-"));
    try {
      const archive = join(root, "build.tar"),
        destination = join(root, "application");
      const create = spawnSync(
        "python3",
        [
          "-c",
          `
import io, sys, tarfile
kind, filename = sys.argv[1:]
with tarfile.open(filename, "w:") as t:
    m = tarfile.TarInfo(".vercel/output/config.json")
    m.size = 2
    if kind == "traversal": m.name = "../../escaped"
    if kind == "absolute": m.name = "/tmp/escaped"
    if kind == "symlink": m.type = tarfile.SYMTYPE; m.linkname = "../../../escaped"; m.size = 0
    if kind == "hardlink": m.type = tarfile.LNKTYPE; m.linkname = "../../escaped"; m.size = 0
    if kind == "device": m.type = tarfile.CHRTYPE; m.size = 0
    t.addfile(m, io.BytesIO(b"{}") if m.isfile() else None)
    if kind == "duplicate": t.addfile(m, io.BytesIO(b"{}"))
`,
          kind,
          archive,
        ],
        { encoding: "utf8" },
      );
      expect(create.status).toBe(0);
      const result = spawnSync(
        "python3",
        ["scripts/release/maintenance-archive.py", archive, destination],
        { encoding: "utf8" },
      );
      if (kind === "normal") {
        expect(result.status).toBe(0);
        expect(
          readFileSync(join(destination, ".vercel/output/config.json"), "utf8"),
        ).toBe("{}");
      } else {
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("extraction stopped");
      }
      expect(existsSync(join(root, "escaped"))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);
