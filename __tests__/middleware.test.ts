/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

describe("locale middleware", () => {
  it("keeps the path locale when an internal home rewrite sees an older cookie", () => {
    const request = new NextRequest("https://portfolio.test/", {
      headers: {
        cookie: "portfolio-locale=sv",
        "x-locale": "ar",
      },
    });

    const response = middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-request-x-locale")).toBe("ar");
  });

  it("sets Arabic before rewriting an Arabic URL over a Swedish cookie", () => {
    const request = new NextRequest("https://portfolio.test/ar", {
      headers: { cookie: "portfolio-locale=sv" },
    });

    const response = middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBe("https://portfolio.test/");
    expect(response.cookies.get("portfolio-locale")?.value).toBe("ar");
  });
});
