import { spawn } from "node:child_process";
import { appendFileSync } from "node:fs";

const heartbeatIntervalMs = 30_000;

function runCommand(label, command, args, startedAt, envOverrides) {
  return new Promise((resolve) => {
    // npm.cmd needs a shell on Windows. Reuse the launching npm CLI instead,
    // keeping paths and arguments literal on every platform.
    if (/^npm(?:\.cmd)?$/.test(command) && process.env.npm_execpath) {
      args = [process.env.npm_execpath, ...args];
      command = process.execPath;
    }
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      env: { ...process.env, ...envOverrides },
    });
    const heartbeat = setInterval(() => {
      const seconds = Math.round((Date.now() - startedAt) / 1000);
      console.log(`... ${label} still running (${seconds}s)`);
    }, heartbeatIntervalMs);

    child.on("error", (error) => {
      clearInterval(heartbeat);
      const code = ["ENOENT", "EACCES", "EPERM"].includes(error.code)
        ? error.code
        : "SPAWN_ERROR";
      console.error(`${label}: command could not start (${code}).`);
      resolve({ status: 1, signal: null });
    });
    child.on("exit", (status, signal) => {
      clearInterval(heartbeat);
      resolve({ status, signal });
    });
  });
}

export async function runStages(stages) {
  const startedAt = Date.now();

  for (const [label, command, args, envOverrides] of stages) {
    const stageStartedAt = Date.now();
    console.log(`\n==> ${label}`);
    const result = await runCommand(
      label,
      command,
      args,
      stageStartedAt,
      envOverrides,
    );
    const seconds = ((Date.now() - stageStartedAt) / 1000).toFixed(1);
    if (process.env.RELEASE_REPORT_PATH) {
      appendFileSync(
        process.env.RELEASE_REPORT_PATH,
        JSON.stringify({
          event: "stage",
          label,
          durationMs: Date.now() - stageStartedAt,
          outcome:
            result.status === 0 && !result.signal ? "success" : "failure",
        }) + "\n",
      );
    }
    if (result.status !== 0 || result.signal) {
      console.error(`<== ${label} failed after ${seconds}s`);
      process.exit(result.status ?? 1);
    }
    console.log(`<== ${label} completed in ${seconds}s`);
  }

  console.log(
    `\nAll stages completed in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`,
  );
}
