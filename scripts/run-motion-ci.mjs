import { spawn } from "node:child_process";
import { createServer } from "node:net";

const port = await new Promise((resolve, reject) => {
  const server = createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    server.close(() => resolve(address.port));
  });
});
const baseURL = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)], {
  stdio: "inherit", cwd: process.env.PERF_SERVER_ROOT ?? process.cwd(),
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try { ready = (await fetch(baseURL, { signal: AbortSignal.timeout(2000) })).ok; } catch { /* Startup in progress. */ }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (!ready) throw new Error("Motion test server did not start");
  process.exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/measure-motion-performance.mjs"], {
      stdio: "inherit", env: { ...process.env, PERF_BASE_URL: baseURL },
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
} finally {
  server.kill("SIGTERM");
}
