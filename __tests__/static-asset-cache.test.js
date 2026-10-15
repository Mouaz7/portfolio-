/* eslint-disable @typescript-eslint/no-require-imports */
const { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } = require("next/constants");
const nextConfig = require("../next.config");

const assetSources = [
  "/brand/:path*",
  "/contact/:path*",
  "/home/:path*",
  "/journey/:path*",
  "/project-icons/:path*",
  "/skill-icons/:path*",
];

test("production caches public images briefly without caching API responses", async () => {
  const rules = await nextConfig(PHASE_PRODUCTION_BUILD).headers();
  for (const source of assetSources) {
    const rule = rules.find((candidate) => candidate.source === source);
    expect(rule?.headers).toContainEqual({
      key: "Cache-Control",
      value: "public, max-age=300, must-revalidate",
    });
  }
  expect(rules.find((rule) => rule.source === "/:path*").headers)
    .not.toEqual(expect.arrayContaining([expect.objectContaining({ key: "Cache-Control" })]));
});

test("development keeps image responses immediately refreshable", async () => {
  const rules = await nextConfig(PHASE_DEVELOPMENT_SERVER).headers();
  expect(rules.some((rule) => assetSources.includes(rule.source))).toBe(false);
});
