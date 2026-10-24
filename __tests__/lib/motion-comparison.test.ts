/** @jest-environment node */
import { compareMotionReports } from "@/scripts/motion-comparison.cjs";

function report(region = "header", lcp = 972, gridVisible = 3344.1, blocking = 700) {
  return {
    profile: { cpu: 4 },
    routes: {
      "/skills": {
        lcp, gridVisible, blocking, cls: 0,
        runs: [-1, 0, 1].map((offset) => ({
          lcp: lcp + offset * 10,
          gridVisible: gridVisible + offset * 10,
          blocking: blocking + offset * 10,
          lcpElement: {
            tag: region === "header" ? "SPAN" : "DIV",
            className: region === "header" ? "site-header-nav-label" : "skill-icon",
            region,
            text: region === "header" ? "Code Review" : "",
            url: region === "header" ? "" : `/skill-icons/${offset === 0 ? "mobile-firebase" : "mobile-kotlin"}.svg`,
            size: region === "header" ? 2856 : 2230,
          },
        })),
      },
    },
  };
}

describe("motion regression comparisons", () => {
  it("accepts the CI header-to-content change when equal-area SVG winners alternate", () => {
    const before = report();
    const after = report("main", 2168, 1091.4, 555);
    before.routes["/skills"].runs.forEach((run, index) => {
      run.lcp = [1000, 972, 972][index];
      run.gridVisible = [3551.8, 3335.8, 3344.1][index];
    });
    after.routes["/skills"].runs.forEach((run, index) => {
      run.lcp = [2168, 1540, 2184][index];
      run.gridVisible = [1141.2, 1078, 1091.4][index];
    });
    const result = compareMotionReports(after, before);
    expect(result.failures).toEqual([]);
    expect(result.warnings).toEqual([expect.stringContaining("relative LCP is not comparable")]);
  });

  it.each([
    ["unchanged header", "header"],
    ["main-to-main change", "main"],
  ])("retains the LCP gate for %s", (_name, region) => {
    const result = compareMotionReports(report(region, 2168, 1091.4), report(region));
    expect(result.failures).toContain("/skills lcp: 972 -> 2168");
  });

  it("rejects unrelated content shapes", () => {
    const after = report("main", 2168, 1091.4);
    after.routes["/skills"].runs[1].lcpElement.size = 3000;
    expect(compareMotionReports(after, report()).failures).toContain("/skills lcp: 972 -> 2168");
  });

  it("does not waive LCP when candidate metadata is missing", () => {
    const after = report("main", 2168, 1091.4);
    Object.assign(after.routes["/skills"].runs[0], { lcpElement: undefined });
    expect(compareMotionReports(after, report()).failures).toContain("/skills lcp: 972 -> 2168");
  });

  it("does not waive LCP when any run exceeds the absolute objective", () => {
    const after = report("main", 2168, 1091.4);
    after.routes["/skills"].runs[2].lcp = 2600;
    expect(compareMotionReports(after, report()).failures).toContain("/skills lcp: 972 -> 2168");
  });

  it("requires a grid improvement greater than 15 percent and 100 ms", () => {
    expect(compareMotionReports(report("main", 2168, 3250), report()).failures)
      .toContain("/skills lcp: 972 -> 2168");
  });

  it("requires all grid runs to improve without overlap", () => {
    const after = report("main", 2168, 1091.4);
    after.routes["/skills"].runs[2].gridVisible = 3400;
    expect(compareMotionReports(after, report()).failures).toContain("/skills lcp: 972 -> 2168");
  });

  it("keeps the blocking gate even when the LCP candidate changes", () => {
    expect(compareMotionReports(report("main", 2168, 1091.4, 1100), report()).failures)
      .toContain("/skills blocking: 700 -> 1100");
  });

  it("keeps the grid regression gate", () => {
    expect(compareMotionReports(report("header", 972, 2000), report("header", 972, 1000)).failures)
      .toContain("/skills gridVisible: 1000 -> 2000");
  });

  it("keeps the absolute CLS gate without a baseline", () => {
    const after = report();
    after.routes["/skills"].cls = 0.06;
    expect(compareMotionReports(after).failures).toContain("/skills CLS 0.06");
  });

  it("fails mismatched profiles and missing baseline routes", () => {
    const before = report();
    before.profile.cpu = 2;
    expect(compareMotionReports(report(), before).failures).toEqual(["Performance profiles differ"]);
    expect(compareMotionReports(report(), { profile: { cpu: 4 }, routes: {} }).failures)
      .toEqual(["Missing baseline: /skills"]);
  });

  it("retains the existing overlapping-sample noise rule", () => {
    const before = report();
    const after = report("header", 1250);
    after.routes["/skills"].runs[0].lcp = 950;
    expect(compareMotionReports(after, before).failures).toEqual([]);
    expect(compareMotionReports(after, before).warnings).toEqual([expect.stringContaining("ranges overlap")]);
  });
});
