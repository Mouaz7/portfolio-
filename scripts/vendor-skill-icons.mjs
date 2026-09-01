import crypto from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const seedPath = path.join(root, "supabase", "seed.sql");
const outputDirectory = path.join(root, "public", "skill-icons");
const manifestPath = path.join(root, "docs", "skill-icon-sources.json");
const seed = await readFile(seedPath, "utf8");

const tuplePattern = /\('([^']+)',\s*'([^']+)',\s*'',\s*'(https:\/\/[^']+)',\s*(null|'https:\/\/[^']+'),\s*'[^']*',\s*(?:true|false),\s*\d+,\s*true\)/g;
let entries = [];
for (const match of seed.matchAll(tuplePattern)) {
  const [, name, category, source, lightValue] = match;
  entries.push({
    category,
    name,
    source,
    sourceLight: lightValue === "null" ? null : lightValue.slice(1, -1),
  });
}

if (entries.length === 0) {
  entries = JSON.parse(await readFile(manifestPath, "utf8"));
}
if (entries.length !== 50) {
  throw new Error(`Expected 50 skill rows or manifest entries, found ${entries.length}`);
}

function slug(value) {
  if (value === "C++") return "c-plus-plus";
  return value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function materialize(downloadUrl, filename, expected) {
  const target = path.join(outputDirectory, filename);
  if (downloadUrl === null) {
    const svg = await readFile(target, "utf8");
    const actual = {
      bytes: Buffer.byteLength(svg),
      sha256: crypto.createHash("sha256").update(svg).digest("hex"),
    };
    if (expected?.sha256 && actual.sha256 !== expected.sha256) {
      throw new Error(`${target}: manually sourced asset hash changed`);
    }
    return actual;
  }

  const url = downloadUrl;
  const response = await fetch(url, {
    headers: { "User-Agent": "Mouaz7/portofolio skill-icon vendor script" },
  });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const svg = `${(await response.text()).trimEnd()}\n`;
  if (!/^\s*<svg[\s>]/i.test(svg)) {
    throw new Error(`${url}: response is not an SVG`);
  }
  await writeFile(target, svg, "utf8");
  return {
    bytes: Buffer.byteLength(svg),
    sha256: crypto.createHash("sha256").update(svg).digest("hex"),
  };
}

await mkdir(outputDirectory, { recursive: true });
const manifest = [];
let updatedSeed = seed;

for (const entry of entries) {
  const base = `${entry.category}-${slug(entry.name)}`;
  const filename = `${base}.svg`;
  const localPath = `/skill-icons/${filename}`;
  const primary = await materialize(
    entry.downloadSource === null ? null : (entry.downloadSource ?? entry.source),
    filename,
    entry.primary,
  );
  let localPathLight = null;
  let light = null;
  if (entry.sourceLight) {
    const lightFilename = `${base}-light.svg`;
    localPathLight = `/skill-icons/${lightFilename}`;
    light = await materialize(
      entry.downloadSourceLight === null
        ? null
        : (entry.downloadSourceLight ?? entry.sourceLight),
      lightFilename,
      entry.light,
    );
  }

  updatedSeed = updatedSeed
    .replace(`'${entry.source}'`, `'${localPath}'`)
    .replace(
      entry.sourceLight ? `'${entry.sourceLight}'` : "__unused__",
      entry.sourceLight ? `'${localPathLight}'` : "__unused__",
    );
  manifest.push({
    ...entry,
    localPath,
    localPathLight,
    primary,
    light,
  });
}

await writeFile(seedPath, updatedSeed, "utf8");
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
const sqlValue = (value) => value === null
  ? "null"
  : `'${value.replaceAll("'", "''")}'`;
const migration = `-- Keep production skill rows on the same exact SVGs as the deterministic seed.\n\nupdate public.skill as skill\nset icon_bucket = '',\n    icon_path = source.icon_path,\n    icon_path_light = source.icon_path_light,\n    updated_at = timezone('utc', now())\nfrom (values\n${manifest.map((entry) => `  (${sqlValue(entry.category)}, ${sqlValue(entry.name)}, ${sqlValue(entry.localPath)}, ${sqlValue(entry.localPathLight)})`).join(",\n")}\n) as source(category, name, icon_path, icon_path_light)\nwhere skill.category = source.category\n  and skill.name = source.name;\n`;
await writeFile(
  path.join(root, "supabase", "migrations", "20260828121000_self_host_skill_icons.sql"),
  migration,
  "utf8",
);
console.log(`Vendored ${manifest.length} skill icons into ${outputDirectory}`);
