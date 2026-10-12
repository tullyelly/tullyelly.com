/** @jest-environment node */
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync, spawnSync, spawn } from "node:child_process";
const helper = resolve("scripts/release/code-build-context.py");
const examples = [".env.example", ".env.test.example"];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "build-context-test-"));
  const git = (args: string[]) =>
    execFileSync("git", args, { cwd: root, stdio: "pipe" });
  git(["init", "-q"]);
  for (const name of examples)
    writeFileSync(join(root, name), "EXAMPLE=placeholder\n");
  git(["add", "."]);
  git([
    "-c",
    "user.name=Fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "-c",
    "commit.gpgsign=false",
    "-c",
    "core.hooksPath=/dev/null",
    "commit",
    "-qm",
    "fixture",
  ]);
  mkdirSync(join(root, "bin"));
  writeFileSync(
    join(root, "bin/vercel"),
    `#!${process.execPath}
const fs = require('node:fs');
fs.writeFileSync('observed.json', JSON.stringify({absent: ['.env.example','.env.test.example'].every(p=>!fs.existsSync(p)),args:process.argv.slice(2)}));
if (process.env.FIXTURE_MODE === 'interrupt') setInterval(()=>{},1000);
else process.exit(process.env.FIXTURE_MODE === 'failure' ? 7 : 0);
`,
    { mode: 0o700 },
  );
  return {
    root,
    env: { ...process.env, PATH: `${join(root, "bin")}:${process.env.PATH}` },
  };
}
function restored(root: string) {
  for (const name of examples)
    expect(readFileSync(join(root, name), "utf8")).toBe(
      "EXAMPLE=placeholder\n",
    );
}
test.each(["success", "failure"])(
  "excludes only the examples and restores on %s",
  (mode) => {
    const { root, env } = fixture();
    try {
      const r = spawnSync("python3", [helper, root], {
        env: { ...env, FIXTURE_MODE: mode },
        encoding: "utf8",
      });
      expect(r.status).toBe(mode === "success" ? 0 : 7);
      expect(
        JSON.parse(readFileSync(join(root, "observed.json"), "utf8")),
      ).toEqual({
        absent: true,
        args: ["build", "--prod", "--standalone", "--non-interactive"],
      });
      restored(root);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);
test.each([
  ".env",
  ".env.production",
  ".env.test.local",
  ".env.unapproved.example",
])("rejects unexpected %s before mutation", (name) => {
  const { root, env } = fixture();
  try {
    writeFileSync(join(root, name), "SENSITIVE_FIXTURE_DO_NOT_LOG");
    const r = spawnSync("python3", [helper, root], { env, encoding: "utf8" });
    expect(r.status).toBe(1);
    expect(r.stderr.trim()).toBe("code.build-local-env-present");
    expect(existsSync(join(root, "observed.json"))).toBe(false);
    restored(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test.each(["modified", "symlink", "missing"])(
  "rejects %s example without deleting originals",
  (kind) => {
    const { root, env } = fixture();
    try {
      const path = join(root, examples[1]);
      if (kind === "modified")
        writeFileSync(path, "SENSITIVE_FIXTURE_DO_NOT_LOG");
      else {
        rmSync(path);
        if (kind === "symlink") symlinkSync(join(root, examples[0]), path);
      }
      const r = spawnSync("python3", [helper, root], { env, encoding: "utf8" });
      expect(r.stderr.trim()).toBe("code.build-example-unreviewed");
      expect(r.status).toBe(1);
      expect(readFileSync(join(root, examples[0]), "utf8")).toBe(
        "EXAMPLE=placeholder\n",
      );
      expect(existsSync(join(root, "observed.json"))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);
test.each(["SIGINT", "SIGTERM"] as const)(
  "restores examples and terminates build on %s",
  async (signal) => {
    const { root, env } = fixture();
    const child = spawn("python3", [helper, root], {
      env: { ...env, FIXTURE_MODE: "interrupt" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let diagnostic = "";
    child.stderr.on("data", (data) => {
      diagnostic += data.toString();
    });
    const ended = new Promise<number | null>((resolveExit) =>
      child.on("exit", resolveExit),
    );
    try {
      for (let i = 0; i < 100 && !existsSync(join(root, "observed.json")); i++)
        await new Promise((resolveWait) => setTimeout(resolveWait, 20));
      expect(existsSync(join(root, "observed.json"))).toBe(true);
      child.kill(signal);
      expect(await ended).toBe(1);
      expect(diagnostic.trim()).toBe("code.build-interrupted");
      restored(root);
    } finally {
      if (child.exitCode === null) {
        child.kill("SIGTERM");
        await ended;
      }
      rmSync(root, { recursive: true, force: true });
    }
  },
);

test("failed build process creation restores both original templates", () => {
  const { root, env } = fixture();
  try {
    rmSync(join(root, "bin/vercel"));
    const r = spawnSync("/usr/bin/python3", [helper, root], {
      env: { ...env, PATH: "/usr/bin:/bin" },
      encoding: "utf8",
    });
    expect(r.status).toBe(1);
    expect(r.stderr.trim()).toBe("code.build-context-failed");
    restored(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test.each(["partial-move", "after-move", "restore"])(
  "retains originals on %s I/O failure",
  (mode) => {
    const { root, env } = fixture();
    const backup = join(root, "backup");
    mkdirSync(backup);
    try {
      const script = `import importlib.util,pathlib,sys
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('context',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
root=pathlib.Path(sys.argv[2]);backup=sys.argv[3];mode=sys.argv[4]
m.tempfile.mkdtemp=lambda **kw: backup
original=pathlib.Path.rename
def injected(self,destination):
    if self.name=='.env.test.example' and ((mode=='partial-move' and self.parent==root) or (mode=='restore' and pathlib.Path(destination).parent==root)):
        raise OSError('SENSITIVE_FIXTURE_DO_NOT_LOG')
    result=original(self,destination)
    if mode=='after-move' and self.parent==root:
        raise InterruptedError()
    return result
pathlib.Path.rename=injected
try:
    m.build(root)
    sys.exit(2)
except Exception as error:
    assert (mode in ('partial-move','after-move') and isinstance(error,OSError)) or (mode=='restore' and str(error)=='code.build-context-restore-failed')
`;
      const r = spawnSync(
        "python3",
        ["-c", script, helper, root, backup, mode],
        { env, encoding: "utf8" },
      );
      expect(r.status).toBe(0);
      expect(r.stderr).toBe("");
      expect(readFileSync(join(root, examples[0]), "utf8")).toBe(
        "EXAMPLE=placeholder\n",
      );
      const second =
        mode === "restore"
          ? join(backup, examples[1])
          : join(root, examples[1]);
      expect(readFileSync(second, "utf8")).toBe("EXAMPLE=placeholder\n");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);
