/**
 * @jest-environment node
 */

import { POST } from "@/app/api/internal/revalidate/route";
import { revalidateTag } from "next/cache";

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}));

describe("internal cache revalidation", () => {
  const originalSecret = process.env.REVALIDATE_SECRET;

  beforeEach(() => {
    process.env.REVALIDATE_SECRET = "test-revalidation-secret";
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.REVALIDATE_SECRET;
    } else {
      process.env.REVALIDATE_SECRET = originalSecret;
    }
  });

  it("rejects requests without the secret", async () => {
    const response = await POST(
      new Request("http://localhost/api/internal/revalidate", {
        method: "POST",
        body: JSON.stringify({ tags: ["projects"] }),
      }),
    );

    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it.each([
    "Basic test-revalidation-secret",
    "Bearer",
    "Bearer  test-revalidation-secret",
    "Bearer test-revalidation-secret extra",
    "Bearer test-revalidation-secret-with-extra-data",
  ])("rejects malformed or unequal authorization: %s", async (authorization) => {
    const response = await POST(
      new Request("http://localhost/api/internal/revalidate", {
        method: "POST",
        headers: { Authorization: authorization },
        body: JSON.stringify({ tags: ["projects"] }),
      }),
    );

    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("accepts a case-insensitive Bearer scheme with the exact token", async () => {
    const response = await POST(
      new Request("http://localhost/api/internal/revalidate", {
        method: "POST",
        headers: { Authorization: "bearer test-revalidation-secret" },
        body: JSON.stringify({ tags: ["skills"] }),
      }),
    );

    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("skills");
  });

  it("revalidates only approved tags", async () => {
    const response = await POST(
      new Request("http://localhost/api/internal/revalidate", {
        method: "POST",
        headers: { Authorization: "Bearer test-revalidation-secret" },
        body: JSON.stringify({ tags: ["projects", "home-content", "unknown"] }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ revalidated: ["projects", "home-content"] });
    expect(revalidateTag).toHaveBeenNthCalledWith(1, "projects");
    expect(revalidateTag).toHaveBeenNthCalledWith(2, "home-content");
  });

  it("bounds authenticated JSON bodies", async () => {
    const response = await POST(
      new Request("http://localhost/api/internal/revalidate", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-revalidation-secret",
          "Content-Type": "application/json",
          "Content-Length": "5000",
        },
        body: "{}",
      }),
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({ code: "body_too_large" });
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
