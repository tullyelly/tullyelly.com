import { spawn } from "node:child_process";

const heartbeatIntervalMs = 30_000;

function runCommand(label, command, args, startedAt) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      env: process.env,
    });
    const heartbeat = setInterval(() => {
      const seconds = Math.round((Date.now() - startedAt) / 1000);
      console.log(`... ${label} still running (${seconds}s)`);
    }, heartbeatIntervalMs);

    child.on("exit", (status, signal) => {
      clearInterval(heartbeat);
      resolve({ status, signal });
    });
  });
}

export async function runStages(stages) {
  const startedAt = Date.now();

  for (const [label, command, args] of stages) {
    const stageStartedAt = Date.now();
    console.log(`\n==> ${label}`);
    const result = await runCommand(label, command, args, stageStartedAt);
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
