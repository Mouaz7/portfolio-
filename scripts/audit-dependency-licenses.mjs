import fs from "node:fs/promises";

const lock = JSON.parse(await fs.readFile("package-lock.json", "utf8"));
const packages = Object.entries(lock.packages ?? {})
  .filter(([path]) => path.startsWith("node_modules/"))
  .map(([path, metadata]) => ({
    dev: metadata.dev === true,
    license: metadata.license ?? "MISSING",
    name: metadata.name ?? path.slice(path.lastIndexOf("node_modules/") + "node_modules/".length),
    optional: metadata.optional === true,
    path,
    version: metadata.version ?? "unknown",
  }));

const blockedPattern = /(?:^|\(|\s)(?:A?GPL|SSPL)(?:-|\b)/i;
// This narrow list is only a triage aid, not a legal approval. Mixed SPDX
// expressions and other license families remain visible for owner review.
const standardPermissiveIds = new Set([
  "0BSD", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause",
  "CC0-1.0", "ISC", "MIT", "MIT-0",
]);
const missing = packages.filter((entry) => entry.license === "MISSING");
const blocked = packages.filter((entry) => blockedPattern.test(entry.license));
const manualReview = packages
  .filter((entry) => entry.license !== "MISSING"
    && !blockedPattern.test(entry.license)
    && !standardPermissiveIds.has(entry.license))
  .sort((left, right) => left.name.localeCompare(right.name)
    || left.version.localeCompare(right.version)
    || left.path.localeCompare(right.path));
const licenses = Object.entries(
  packages.reduce((counts, entry) => {
    counts[entry.license] = (counts[entry.license] ?? 0) + 1;
    return counts;
  }, {}),
).sort(([left], [right]) => left.localeCompare(right));

console.log(JSON.stringify({
  blocked,
  licenseCounts: Object.fromEntries(licenses),
  manualReview,
  manualReviewCount: manualReview.length,
  missing,
  packageCount: packages.length,
}, null, 2));

if (blocked.length || missing.length) process.exitCode = 1;
