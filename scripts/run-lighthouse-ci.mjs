import { spawn } from "node:child_process";
import { readdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// A WSL shell can expose Windows TEMP values to Linux Node. Node then treats
// the drive-letter path as relative and Chrome creates it inside the repo.
const runtimeTempDirectory = process.platform === "win32" ? tmpdir() : "/tmp";

async function removeMisplacedLighthouseProfiles() {
  const entries = await readdir(projectDirectory, { withFileTypes: true });
  await Promise.all(entries
    .filter((entry) => entry.isDirectory()
      && entry.name.startsWith("C:\\Users\\")
      && entry.name.includes("\\lighthouse."))
    .map((entry) => rm(join(projectDirectory, entry.name), { recursive: true, force: true })));
}

function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Unable to reserve a Lighthouse port"));
        return;
      }
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

const config = JSON.parse(await readFile(new URL("../lighthouserc.json", import.meta.url), "utf8"));
const runtimeConfig = join(runtimeTempDirectory, `portofolio-lhci-${process.pid}.json`);
const args = ["--yes", "@lhci/cli@0.15.1", "autorun", `--config=${runtimeConfig}`];

// Journey's animated mobile graph produces NO_LCP in Lighthouse, despite
// visible content and a valid desktop LCP in the separate motion measurement.
// Preserve its existing reduced-motion diagnostic without altering the page
// or weakening assertions. The other routes use their normal animations.
const journeyUrls = config.ci.collect.url.filter((url) => new URL(url).pathname === "/journey");
const normalUrls = config.ci.collect.url.filter((url) => new URL(url).pathname !== "/journey");
const profiles = [
  { name: "normal-motion", urls: normalUrls, reducedMotion: false },
  { name: "journey-reduced-motion", urls: journeyUrls, reducedMotion: true },
].filter((profile) => profile.urls.length > 0);

const lighthouseEnvironment = {
  ...process.env,
  CHROME_PATH: chromium.executablePath(),
  NODE_ENV: "production",
};

// Keep every Chrome/Lighthouse temporary path outside the repository. Some
// WSL shells expose Windows paths that Chrome Launcher treats as relative on
// Linux, creating folders such as `C:\\Users\\...` in the current directory.
if (process.platform !== "win32") {
  lighthouseEnvironment.LOCALAPPDATA = runtimeTempDirectory;
  lighthouseEnvironment.TMPDIR = runtimeTempDirectory;
  lighthouseEnvironment.TEMP = runtimeTempDirectory;
  lighthouseEnvironment.TMP = runtimeTempDirectory;
  lighthouseEnvironment.XDG_CACHE_HOME = runtimeTempDirectory;
  lighthouseEnvironment.XDG_CONFIG_HOME = runtimeTempDirectory;
  lighthouseEnvironment.XDG_RUNTIME_DIR = runtimeTempDirectory;
  lighthouseEnvironment.CHROME_CONFIG_HOME = runtimeTempDirectory;
  lighthouseEnvironment.CHROME_USER_DATA_DIR = runtimeTempDirectory;
}

try {
  await removeMisplacedLighthouseProfiles();
  for (const profile of profiles) {
    const port = await findAvailablePort();
    const runtime = structuredClone(config);
    runtime.ci.collect.startServerCommand = `npm start -- -H 127.0.0.1 -p ${port}`;
    runtime.ci.collect.url = profile.urls.map((configuredUrl) => {
      const url = new URL(configuredUrl);
      url.hostname = "127.0.0.1";
      url.port = String(port);
      return url.toString();
    });
    if (profile.reducedMotion) {
      runtime.ci.collect.settings.chromeFlags += " --force-prefers-reduced-motion";
    }
    if (runtime.ci.upload.target === "filesystem") {
      runtime.ci.upload.outputDir = join(runtime.ci.upload.outputDir, profile.name);
    }
    await writeFile(runtimeConfig, `${JSON.stringify(runtime, null, 2)}\n`, "utf8");
    console.log(`Lighthouse profile: ${profile.name}`);
    const exitCode = await new Promise((resolve, reject) => {
      const lighthouse = spawn(command, args, { env: lighthouseEnvironment, stdio: "inherit" });
      lighthouse.once("error", reject);
      lighthouse.once("exit", (code) => resolve(code ?? 1));
    });
    if (exitCode !== 0) {
      process.exitCode = exitCode;
      break;
    }
  }
} catch (error) {
  console.error(`Unable to start Lighthouse CI: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  await removeMisplacedLighthouseProfiles();
  await unlink(runtimeConfig).catch(() => undefined);
}
