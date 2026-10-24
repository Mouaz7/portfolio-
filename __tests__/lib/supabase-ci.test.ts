/** @jest-environment node */
import { execFileSync } from "node:child_process";
import { createServer, type Server } from "node:net";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

test("CI copies an unlinked project, selects free ports and leaves the source configuration intact", async () => {
  const fixture = mkdtempSync(join(tmpdir(), "portfolio-supabase-test-"));
  const reservations: Server[] = [];
  const reserve = async (port = 0) => {
    const server = createServer();
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, "0.0.0.0", resolve);
    });
    reservations.push(server);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected TCP address");
    return address.port;
  };
  try {
    const occupied = await reserve();
    const directory = join(fixture, "supabase");
    const runnerTemp = join(fixture, "runner temp");
    mkdirSync(runnerTemp);
    for (const name of ["migrations", "tests", ".temp"]) mkdirSync(join(directory, name), { recursive: true });
    const original = readFileSync("supabase/config.toml", "utf8").replace("port = 54322", `port = ${occupied}`);
    writeFileSync(join(directory, "config.toml"), original);
    writeFileSync(join(directory, "migrations", "001.sql"), "select 1;");
    writeFileSync(join(directory, "tests", "policies.sql"), "select plan(1);");
    writeFileSync(join(directory, "seed.sql"), "select 2;");
    writeFileSync(join(directory, ".temp", "project-ref"), "must-not-be-copied");
    const environmentFile = join(fixture, "github env");
    const prepare = () => JSON.parse(execFileSync(process.execPath, [resolve("scripts/prepare-supabase-ci.mjs")], {
      cwd: fixture,
      env: { ...process.env, RUNNER_TEMP: runnerTemp, GITHUB_ENV: environmentFile, GITHUB_JOB: "database" },
      encoding: "utf8",
    }));
    const first = prepare();
    const ports = [first.apiPort, first.databasePort, first.shadowPort];
    expect(new Set(ports).size).toBe(3);
    expect(ports).not.toContain(occupied);
    // Simulate the first stack owning its published ports while another job
    // prepares its own stack on the same Docker host.
    for (const port of ports) await reserve(port);
    const second = prepare();
    expect(second.projectId).not.toBe(first.projectId);
    for (const port of [second.apiPort, second.databasePort, second.shadowPort]) expect(ports).not.toContain(port);
    const copied = join(first.workdir, "supabase");
    const config = readFileSync(join(copied, "config.toml"), "utf8");
    expect(config).toContain(`project_id = "${first.projectId}"`);
    expect(config).toContain(`port = ${first.databasePort}`);
    expect(readFileSync(join(copied, "migrations", "001.sql"), "utf8")).toBe("select 1;");
    expect(readFileSync(join(copied, "tests", "policies.sql"), "utf8")).toBe("select plan(1);");
    expect(readFileSync(join(copied, "seed.sql"), "utf8")).toBe("select 2;");
    expect(existsSync(join(copied, ".temp"))).toBe(false);
    expect(readFileSync(join(directory, "config.toml"), "utf8")).toBe(original);
    expect(readFileSync(environmentFile, "utf8")).toContain(`SUPABASE_CI_WORKDIR=${first.workdir}\n`);
  } finally {
    await Promise.all(reservations.map((server) => new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    })));
    rmSync(fixture, { recursive: true, force: true });
  }
});
