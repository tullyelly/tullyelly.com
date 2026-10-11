import { spawn } from "node:child_process";

const heartbeatIntervalMs = 30_000;

function runCommand(label, command, args, startedAt, env) {
  return new Promise((resolve) => {
    // npm.cmd cannot be spawned without a shell on Windows. Reuse the npm CLI
    // that launched this process, without introducing shell argument parsing.
    if (/^npm(?:\.cmd)?$/.test(command) && process.env.npm_execpath) {
      args = [process.env.npm_execpath, ...args];
      command = process.execPath;
    }
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      env: { ...process.env, ...env },
    });
    const heartbeat = setInterval(() => {
      const seconds = Math.round((Date.now() - startedAt) / 1000);
      console.log(`... ${label} still running (${seconds}s)`);
    }, heartbeatIntervalMs);

    child.on("error", (error) => {
      clearInterval(heartbeat);
      console.error(`${label}: ${error.message}`);
      resolve({ status: 1 });
    });

    child.on("exit", (status, signal) => {
      clearInterval(heartbeat);
      resolve({ status, signal });
    });
  });
}

export async function runStages(stages) {
  const startedAt = Date.now();

  for (const [label, command, args, env] of stages) {
    const stageStartedAt = Date.now();
    console.log(`\n==> ${label}`);
    const result = await runCommand(label, command, args, stageStartedAt, env);
    const seconds = ((Date.now() - stageStartedAt) / 1000).toFixed(1);
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
