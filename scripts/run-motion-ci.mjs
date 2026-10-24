import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const serverRoot = resolve(process.env.PERF_SERVER_ROOT ?? process.cwd());
const serverEnvironment = { ...process.env };
if (process.env.PERF_SERVER_ROOT) {
  // A historical checkout can require settings that the current application
  // has retired. Supply disposable values only to that isolated subprocess;
  // never restore obsolete requirements to the application's CI environment.
  const source = await readFile(join(serverRoot, "lib/security/production-config.ts"), "utf8");
  const declaration = source.match(/SECURITY_SECRET_NAMES\s*=\s*\[([\s\S]*?)\]\s*as const/);
  if (!declaration) throw new Error("Cannot discover historical security requirements");
  const names = [...declaration[1].matchAll(/["']([A-Z][A-Z0-9_]*)["']/g)].map((match) => match[1]);
  if (names.length === 0) throw new Error("Historical security requirements are empty");
  for (const name of names) {
    if (!serverEnvironment[name]) serverEnvironment[name] = randomBytes(48).toString("base64url");
  }
}

if (process.argv.includes("--build")) {
  if (!process.env.PERF_SERVER_ROOT) throw new Error("Baseline builds require PERF_SERVER_ROOT");
  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(command, ["run", "build"], { cwd: serverRoot, env: serverEnvironment, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
  process.exit(exitCode);
}

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
  stdio: "inherit", cwd: serverRoot, env: serverEnvironment,
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
