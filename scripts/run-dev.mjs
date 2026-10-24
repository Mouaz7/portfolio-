import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const forwardedArgs = process.argv.slice(2);
const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const publicRoutes = [
  "/",
  "/skills",
  "/journey",
  "/projects",
  "/contact",
];

function optionValue(shortName, longName, fallback) {
  const shortIndex = forwardedArgs.indexOf(shortName);
  if (shortIndex >= 0 && forwardedArgs[shortIndex + 1]) return forwardedArgs[shortIndex + 1];
  const longIndex = forwardedArgs.indexOf(longName);
  if (longIndex >= 0 && forwardedArgs[longIndex + 1]) return forwardedArgs[longIndex + 1];
  const inline = forwardedArgs.find((argument) => argument.startsWith(`${longName}=`));
  return inline?.slice(longName.length + 1) || fallback;
}

const port = optionValue("-p", "--port", process.env.PORT || "3000");
const host = optionValue("-H", "--hostname", "127.0.0.1");
const requestHost = host === "0.0.0.0" || host === "::" ? "127.0.0.1" : host;
const origin = `http://${requestHost}:${port}`;
const shutdownController = new AbortController();

const child = spawn(process.execPath, [nextBin, "dev", "--turbopack", ...forwardedArgs], {
  env: process.env,
  stdio: "inherit",
});

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline && !shutdownController.signal.aborted) {
    try {
      const response = await fetch(origin, {
        cache: "no-store",
        signal: shutdownController.signal,
      });
      if (response.ok) return;
    } catch {
      // The socket is expected to refuse connections until Next is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("the dev server did not become ready within 60 seconds");
}

async function warmPublicRoutes() {
  await waitForServer();
  process.stdout.write("\n○ Warming public pages for instant first navigation ...\n");

  const results = await Promise.all(publicRoutes.slice(1).map(async (route) => {
    const startedAt = performance.now();
    const response = await fetch(`${origin}${route}`, {
      cache: "no-store",
      signal: shutdownController.signal,
    });
    if (!response.ok) throw new Error(`${route} returned ${response.status}`);
    await response.arrayBuffer();
    return `${route} ${Math.round(performance.now() - startedAt)}ms`;
  }));

  process.stdout.write(`✓ Public pages ready (${results.join(", ")})\n\n`);
}

void warmPublicRoutes().catch((error) => {
  if (!shutdownController.signal.aborted) {
    process.stderr.write(`⚠ Dev prewarm failed: ${String(error)}\n`);
  }
});

function forwardSignal(signal) {
  shutdownController.abort();
  if (!child.killed) child.kill(signal);
}

process.once("SIGINT", () => forwardSignal("SIGINT"));
process.once("SIGTERM", () => forwardSignal("SIGTERM"));
child.once("exit", (code, signal) => {
  shutdownController.abort();
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
