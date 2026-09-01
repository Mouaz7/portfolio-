/**
 * @jest-environment node
 */

import { POST } from "@/app/api/github/repo-stats/route";

describe("/api/github/repo-stats", () => {
  const originalGitHubToken = process.env.GITHUB_TOKEN;

  beforeEach(() => {
    jest.restoreAllMocks();
    delete process.env.GITHUB_TOKEN;
  });

  afterAll(() => {
    if (originalGitHubToken === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = originalGitHubToken;
    }
  });

  it("rejects malformed request bodies without calling GitHub", async () => {
    const githubFetch = jest.spyOn(global, "fetch");
    const request = new Request("http://localhost/api/github/repo-stats", {
      method: "POST",
      body: "{",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid body",
      code: "invalid_json",
    });
    expect(githubFetch).not.toHaveBeenCalled();
  });

  it("rejects unsupported media types and oversized bodies before calling GitHub", async () => {
    const githubFetch = jest.spyOn(global, "fetch");
    const unsupported = await POST(new Request("http://localhost/api/github/repo-stats", {
      method: "POST",
      headers: { "Content-Type": "text/html" },
      body: "{}",
    }));
    const oversized = await POST(new Request("http://localhost/api/github/repo-stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": "9000",
      },
      body: "{}",
    }));

    expect(unsupported.status).toBe(415);
    expect(oversized.status).toBe(413);
    expect(githubFetch).not.toHaveBeenCalled();
  });

  it("returns empty statistics without calling GitHub when no repositories are requested", async () => {
    const githubFetch = jest.spyOn(global, "fetch");
    const request = new Request("http://localhost/api/github/repo-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repositories: [] }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ stats: {} });
    expect(githubFetch).not.toHaveBeenCalled();
  });

  it("maps only requested repositories from the owner's public repository list", async () => {
    const githubFetch = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            full_name: "Mouaz7/portfolio-",
            private: false,
            stargazers_count: 29,
            subscribers_count: 4,
            forks_count: 2,
            language: "TypeScript",
            fork: false,
            archived: false,
            updated_at: "2026-06-20T00:00:00Z",
          },
          {
            full_name: "Mouaz7/private-project",
            private: true,
            stargazers_count: 1,
            forks_count: 0,
            language: null,
            fork: false,
            archived: false,
            updated_at: "2026-06-19T00:00:00Z",
          },
        ]),
        { status: 200 },
      ),
    );
    const request = new Request("http://localhost/api/github/repo-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repositories: [
          "Mouaz7/portfolio-",
          "mouaz7/PORTFOLIO-",
          "Mouaz7/private-project",
          "Mouaz7/unknown-project",
          "someone-else/repository",
          "not a repository",
        ],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=1800, s-maxage=1800, stale-while-revalidate=1800",
    );
    await expect(response.json()).resolves.toEqual({
      stats: {
        "Mouaz7/portfolio-": {
          stars: 29,
          watchers: 4,
          forks: 2,
          language: "TypeScript",
          isFork: false,
          isArchived: false,
          updatedAt: "2026-06-20T00:00:00Z",
        },
      },
    });
    expect(githubFetch).toHaveBeenCalledTimes(1);
    expect(githubFetch).toHaveBeenCalledWith(
      "https://api.github.com/users/Mouaz7/repos?per_page=100&sort=updated&type=owner",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/vnd.github+json",
          "User-Agent": "portfolio-projects-page",
        }),
        next: { revalidate: 1800 },
      }),
    );
  });

  it("omits repositories when GitHub is unavailable", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("network unavailable"));
    const request = new Request("http://localhost/api/github/repo-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repositories: ["Mouaz7/portfolio-"] }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ stats: {} });
  });

  it("omits repositories when GitHub returns a non-success response", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 403 }));
    const request = new Request("http://localhost/api/github/repo-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repositories: ["Mouaz7/portfolio-"] }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ stats: {} });
  });

  it("uses a server token only for the owner's public repository listing", async () => {
    process.env.GITHUB_TOKEN = "server-token";
    const githubFetch = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    const request = new Request("http://localhost/api/github/repo-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repositories: ["Mouaz7/portfolio-"] }),
    });

    await POST(request);

    expect(githubFetch).toHaveBeenCalledWith(
      "https://api.github.com/users/Mouaz7/repos?per_page=100&sort=updated&type=owner",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer server-token" }),
      }),
    );
  });
});
