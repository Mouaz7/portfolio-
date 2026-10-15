/** @jest-environment node */

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const toolingRequire = createRequire(__filename);
const pluginDirectory = dirname(toolingRequire.resolve("@next/eslint-plugin-next"));
const { getRootDirs } = toolingRequire(join(pluginDirectory, "utils/get-root-dirs.js")) as {
  getRootDirs(context: { cwd: string; settings: { next: { rootDir: string } } }): string[];
};
const { loadNycConfig } = toolingRequire("@istanbuljs/load-nyc-config") as {
  loadNycConfig(options: { cwd: string }): Promise<Record<string, unknown>>;
};

describe("development-tool security overrides", () => {
  let fixtureDirectory: string;

  beforeEach(() => {
    fixtureDirectory = mkdtempSync(join(tmpdir(), "portfolio-tooling-"));
    writeFileSync(join(fixtureDirectory, "package.json"), "{}");
  });

  afterEach(() => {
    rmSync(fixtureDirectory, { recursive: true, force: true });
  });

  it("keeps Next ESLint root globs restricted to directories", () => {
    mkdirSync(join(fixtureDirectory, "apps"));
    mkdirSync(join(fixtureDirectory, "apps", "portfolio"));
    writeFileSync(join(fixtureDirectory, "apps", "notes.txt"), "not a project directory");

    const roots = getRootDirs({
      cwd: fixtureDirectory,
      settings: { next: { rootDir: `${fixtureDirectory}/apps/*` } },
    });

    expect(roots.map((root) => resolve(root))).toEqual([
      join(fixtureDirectory, "apps", "portfolio"),
    ]);
  });

  it("loads NYC YAML configuration through the patched YAML parser", async () => {
    writeFileSync(join(fixtureDirectory, ".nycrc.yaml"), "all: true\ninclude:\n  - src/**/*.ts\nreporter:\n  - text\n");

    await expect(loadNycConfig({ cwd: fixtureDirectory })).resolves.toMatchObject({
      all: true,
      include: ["src/**/*.ts"],
      reporter: ["text"],
    });
  });
});
