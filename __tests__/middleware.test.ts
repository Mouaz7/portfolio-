/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe("locale proxy", () => {
  it("keeps the path locale when an internal home rewrite sees an older cookie", () => {
    const request = new NextRequest("https://portfolio.test/", {
      headers: {
        cookie: "portfolio-locale=sv",
        "x-locale": "ar",
      },
    });

    const response = proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-request-x-locale")).toBe("ar");
  });

  it("sets Arabic before rewriting an Arabic URL over a Swedish cookie", () => {
    const request = new NextRequest("https://portfolio.test/ar", {
      headers: { cookie: "portfolio-locale=sv" },
    });

    const response = proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBe("https://portfolio.test/");
    expect(response.cookies.get("portfolio-locale")?.value).toBe("ar");
  });

  it.each([
    ["/skills-page?from=old", "/skills?from=old"],
    ["/projects-page", "/projects"],
    ["/code-review-page", "/code-review"],
    ["/contact-page", "/contact"],
    ["/sv/skills-page", "/sv/skills"],
  ])("permanently redirects %s to canonical %s", (legacy, canonical) => {
    const response = proxy(new NextRequest(`https://portfolio.test${legacy}`));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(`https://portfolio.test${canonical}`);
    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
  });
});
